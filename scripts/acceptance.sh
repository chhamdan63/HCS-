#!/usr/bin/env bash
# Acceptance tests for the Hamdan Commission Shop Portal.
# Usage: npm run build && PORT=3100 npm start &   then: bash scripts/acceptance.sh
set -u
BASE=${BASE:-http://localhost:3100}
PSQL="psql postgresql://postgres:postgres@127.0.0.1:5432/app_db -tA -c"
pass=0; fail=0
chk() { if [ "$2" = "$3" ]; then echo "PASS: $1 ($2)"; pass=$((pass+1)); else echo "FAIL: $1 — expected [$3] got [$2]"; fail=$((fail+1)); fi; }

echo "=== 1. auth gate ==="
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/stores); chk "unauth /stores status" "$code" "307"
loc=$(curl -s -o /dev/null -w "%{redirect_url}" $BASE/stores); chk "unauth /stores redirect" "$loc" "$BASE/login"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/print/balance-sheet); chk "unauth /print/balance-sheet" "$code" "307"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/stores -H 'content-type: application/json' -d '{"storeName":"Hack"}'); chk "POST without CSRF rejected" "$code" "403"

echo "=== 2. login ==="
TOKEN=$(curl -s $BASE/login | grep -o 'name="csrf-token" value="[^"]*"' | sed 's/.*value="//;s/"//')
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/login -H 'content-type: application/json' -H "x-csrf-token: $TOKEN" -d '{"username":"hamdan","password":"wrong"}')
chk "wrong password rejected" "$code" "401"
curl -s -c /tmp/jar.txt -X POST $BASE/api/login -H 'content-type: application/json' -H "x-csrf-token: $TOKEN" -d '{"username":"hamdan","password":"hamdan@2026"}' > /tmp/login.json
CSRF=$(grep hcs_csrf /tmp/jar.txt | awk '{print $7}')
chk "login ok" "$(head -c 15 /tmp/login.json)" '{"ok":true,"dat'
code=$(curl -s -b /tmp/jar.txt -o /dev/null -w "%{http_code}" $BASE/stores); chk "authed /stores 200" "$code" "200"

echo "=== 3. invoice maths ==="
SID1=$($PSQL "select id from stores where store_name='Al-Madina Traders'")
SID2=$($PSQL "select id from stores where store_name='Chaudhry Grain Store'")
curl -s -b /tmp/jar.txt -X POST $BASE/api/invoices -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"invoiceDate\":\"2026-10-24\",\"agentCode\":\"160018\",\"biltyNo\":\"BT-TEST1\",\"vehicleNo\":\"les-14-2201\",\"permitNo\":null,\"brokery\":0,
       \"lines\":[{\"storeId\":$SID1,\"qtyBori\":5,\"qtyKg\":0,\"rate\":2400},{\"storeId\":$SID2,\"qtyBori\":3,\"qtyKg\":20,\"rate\":2300}]}" > /tmp/inv.json
IID=$(grep -o '"id":[0-9]*' /tmp/inv.json | head -1 | cut -d: -f2)
echo "invoice id: $IID"
ROW=$($PSQL "select corncost||' '||commission||' '||labour||' '||thread||' '||plastic_bag||' '||market_fee||' '||total||' '||total_bori||' '||total_weight from invoices where id=$IID")
chk "server-computed header" "$ROW" "34225.00 246.42 176.00 8.00 276.00 11.20 34942.62 8 580.00"
LINES=$($PSQL "select string_agg(qty_bori||'/'||qty_kg||'/'||price||'/'||total_weight||'/'||amount, ',' order by id) from invoice_items where invoice_id=$IID")
chk "line weights and amounts" "$LINES" "5/0.00/2400.00/350.00/21000.00,3/20.00/2300.00/230.00/13225.00"
chk "ledger row count" "$($PSQL "select count(*) from store_ledger where ref_id=$IID and ref_type in ('invoice','invoice_expense')")" "6"
chk "PIC CORN debit" "$($PSQL "select debit from store_ledger where ref_id=$IID and ref_type='invoice'")" "34942.62"

echo "=== 4. tampered POST ignored ==="
curl -s -b /tmp/jar.txt -X POST $BASE/api/invoices -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"invoiceDate\":\"2026-10-24\",\"agentCode\":\"160018\",\"biltyNo\":\"BT-TAMPER\",\"vehicleNo\":\"TAMPER\",\"brokery\":0,\"total\":1,\"corncost\":1,
       \"lines\":[{\"storeId\":$SID1,\"qtyBori\":5,\"qtyKg\":0,\"rate\":2400}],\"overrides\":{\"labour\":0}}" > /tmp/tamper.json
TID=$(grep -o '"id":[0-9]*' /tmp/tamper.json | head -1 | cut -d: -f2)
chk "tampered total ignored" "$($PSQL "select total from invoices where id=$TID")" "21335.70"

echo "=== 5. editing one invoice does not touch the others ==="
before=$($PSQL "select count(*) from store_ledger")
curl -s -b /tmp/jar.txt -X PUT $BASE/api/invoices -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"id\":$IID,\"invoiceDate\":\"2026-10-24\",\"agentCode\":\"160018\",\"biltyNo\":\"BT-TEST1\",\"vehicleNo\":\"LES-14-2201\",\"brokery\":0,
       \"lines\":[{\"storeId\":$SID1,\"qtyBori\":5,\"qtyKg\":0,\"rate\":2400},{\"storeId\":$SID2,\"qtyBori\":3,\"qtyKg\":20,\"rate\":2300}]}" > /dev/null
after=$($PSQL "select count(*) from store_ledger")
chk "ledger row count stable after edit" "$after" "$before"
chk "other invoices untouched" "$($PSQL "select count(*) from store_ledger where ref_type='invoice' and ref_id<>$IID")" "3"

echo "=== 6. purchase: 2 rows -> 1 header, 2 items, 1 credit ledger row ==="
curl -s -b /tmp/jar.txt -X POST $BASE/api/purchases -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"purchaseDate\":\"2026-10-24\",\"storeId\":$SID1,\"lines\":[{\"qtyBori\":10,\"qtyKg\":0,\"rate\":2300},{\"qtyBori\":5,\"qtyKg\":25,\"rate\":2280}]}" > /tmp/pur.json
PID=$(grep -o '"id":[0-9]*' /tmp/pur.json | head -1 | cut -d: -f2)
chk "purchase items" "$($PSQL "select count(*) from purchase_items where purchase_id=$PID")" "2"
chk "purchase ledger rows" "$($PSQL "select count(*) from store_ledger where ref_type='purchase' and ref_id=$PID")" "1"
chk "purchase credit equals total" "$($PSQL "select (select credit from store_ledger where ref_type='purchase' and ref_id=$PID) = (select total_amount from purchases where id=$PID)")" "t"
chk "purchase weight with loose kg" "$($PSQL "select total_weight from purchases where id=$PID")" "1075.00"
curl -s -b /tmp/jar.txt -X PUT $BASE/api/purchases -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"id\":$PID,\"purchaseDate\":\"2026-10-24\",\"storeId\":$SID1,\"lines\":[{\"qtyBori\":10,\"qtyKg\":0,\"rate\":2300},{\"qtyBori\":5,\"qtyKg\":25,\"rate\":2280}]}" > /dev/null
chk "purchase id preserved on edit" "$($PSQL "select count(*) from purchases where id=$PID")" "1"
chk "exactly one ledger row after edit" "$($PSQL "select count(*) from store_ledger where ref_type='purchase' and ref_id=$PID")" "1"

echo "=== 7. fixed account protected ==="
FID=$($PSQL "select id from stores where store_name='PIC CORN'")
code=$(curl -s -b /tmp/jar.txt -o /tmp/fixed.json -w "%{http_code}" -X PUT $BASE/api/stores -H 'content-type: application/json' -H "x-csrf-token: $CSRF" -d "{\"id\":$FID,\"storeName\":\"PIC CORN RENAMED\"}")
chk "fixed rename rejected" "$code" "400"
echo "   message: $(cat /tmp/fixed.json)"

echo "=== 8. store rename cascades display names ==="
curl -s -b /tmp/jar.txt -X PUT $BASE/api/stores -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"id\":$SID2,\"storeName\":\"  chaudhry grain store  \",\"status\":\"Active\"}" > /dev/null
chk "name title-cased + trimmed" "$($PSQL "select store_name from stores where id=$SID2")" "Chaudhry Grain Store"
chk "ledger display copy updated" "$($PSQL "select count(*) from store_ledger where store_id=$SID2 and store_name<>'Chaudhry Grain Store'")" "0"

echo "=== 9. manual transaction rules ==="
curl -s -b /tmp/jar.txt -X POST $BASE/api/ledger -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d "{\"storeId\":$SID1,\"transactionDate\":\"2026-10-24\",\"description\":\"Cash payment received\",\"type\":\"credit\",\"amount\":5000}" > /tmp/man.json
MID=$(grep -o '"id":[0-9]*' /tmp/man.json | head -1 | cut -d: -f2)
chk "manual row created" "$($PSQL "select ref_type from store_ledger where id=$MID")" "manual"
INVROW=$($PSQL "select id from store_ledger where ref_type='invoice' limit 1")
code=$(curl -s -b /tmp/jar.txt -o /dev/null -w "%{http_code}" -X PUT $BASE/api/ledger -H 'content-type: application/json' -H "x-csrf-token: $CSRF" -d "{\"id\":$INVROW,\"storeId\":$SID1,\"transactionDate\":\"2026-10-24\",\"description\":\"x\",\"type\":\"debit\",\"amount\":1}")
chk "non-manual edit rejected" "$code" "400"

echo "=== 10. balance identity ==="
chk "sum(credit-debit) matches store balances" "$($PSQL "select (select coalesce(sum(credit),0)-coalesce(sum(debit),0) from store_ledger) = (select coalesce(sum(b),0) from (select store_id, sum(credit)-sum(debit) as b from store_ledger group by store_id) t)")" "t"

echo "=== 11. Urdu store name ==="
curl -s -b /tmp/jar.txt -X POST $BASE/api/stores -H 'content-type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"storeName":"  مدنی ٹریڈرز  ","status":"Active"}' > /dev/null
chk "urdu name trimmed" "$($PSQL "select store_name from stores where store_name like '%ٹریڈرز%'")" "مدنی ٹریڈرز"
chk "urdu searchable by trimmed name" "$($PSQL "select count(*) from stores where lower(store_name) = lower('مدنی ٹریڈرز')")" "1"

echo
echo "RESULT: $pass passed, $fail failed"
