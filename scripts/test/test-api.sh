#!/bin/bash

STACK_NAME=$1

API=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

ITEM1_ID=$(uuidgen)
ITEM2_ID=$(uuidgen)

echo "ITEM1_ID=$ITEM1_ID"
echo "ITEM2_ID=$ITEM2_ID"
echo

TESTS_PASSED=0
TESTS_FAILED=0

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
print_json() {
  echo "$1" | jq '.'
}

fail() {
  echo "❌ $1"
  echo "   Expected: $2"
  echo "   Got: $3"
  ((TESTS_FAILED++))
}

pass() {
  echo "✔ $1"
  ((TESTS_PASSED++))
}

assert_status() {
  local name="$1"
  local output="$2"
  local expected="$3"

  if echo "$output" | grep -q "HTTP/2 $expected"; then
    pass "$name"
  else
    fail "$name status" "$expected" "NOT FOUND"
    echo "$output"
  fi
}

assert_json_equals() {
  local name="$1"
  local json="$2"
  local field="$3"
  local expected="$4"

  local value
  value=$(echo "$json" | jq -r "$field")

  if [ "$value" == "$expected" ]; then
    pass "$name"
  else
    fail "$name" "$expected" "$value"
    print_json "$json"
  fi
}

# ============================================================
# 1. HEALTH CHECK (FIRST)
# ============================================================
echo "============================================================"
echo " 1. HEALTH CHECK"
echo "============================================================"

RES1=$(curl -s -i "$API/health")
BODY1=$(echo "$RES1" | sed '1,/^\r$/d')

assert_status "Health 200" "$RES1" "200"
assert_json_equals "Health status OK" "$BODY1" ".data.status" "OK"

print_json "$BODY1"

# ============================================================
# 2. WIPE DATABASE (TRANSPARENT)
# ============================================================
echo
echo "============================================================"
echo " 2. VERIFY EMPTY DATABASE"
echo "============================================================"

RES_WIPE=$(curl -s -i "$API/items")
BODY_WIPE=$(echo "$RES_WIPE" | sed '1,/^\r$/d')

IDS=$(echo "$BODY_WIPE" | jq -r '.data[].id')

# Silent cleanup (NO OUTPUT)
if [ -n "$IDS" ]; then
  for ID in $IDS; do
    curl -s -X DELETE "$API/items/$ID" >/dev/null
  done
fi

# verify empty
RES_CHECK=$(curl -s -i "$API/items")
BODY_CHECK=$(echo "$RES_CHECK" | sed '1,/^\r$/d')

COUNT=$(echo "$BODY_CHECK" | jq '.data | length')

if [ "$COUNT" -eq 0 ]; then
  pass "Database starts empty"
else
  fail "Database not empty after wipe" "0" "$COUNT"
  print_json "$BODY_CHECK"
fi

# ============================================================
# 3. CREATE item1
# ============================================================
echo
echo "============================================================"
echo " 3. CREATE item1"
echo "============================================================"

RES3=$(curl -s -i \
-X POST "$API/items" \
-H "Content-Type: application/json" \
-d "{
  \"id\":\"$ITEM1_ID\",
  \"name\":\"Laptop\",
  \"quantity\":5
}")

BODY3=$(echo "$RES3" | sed '1,/^\r$/d')

assert_status "Create item1" "$RES3" "201"
assert_json_equals "Item1 ID match" "$BODY3" ".data.id" "$ITEM1_ID"

print_json "$BODY3"

# ============================================================
# 4. CREATE item2
# ============================================================
echo
echo "============================================================"
echo " 4. CREATE item2"
echo "============================================================"

RES4=$(curl -s -i \
-X POST "$API/items" \
-H "Content-Type: application/json" \
-d "{
  \"id\":\"$ITEM2_ID\",
  \"name\":\"Monitor\",
  \"quantity\":2
}")

BODY4=$(echo "$RES4" | sed '1,/^\r$/d')

assert_status "Create item2" "$RES4" "201"
assert_json_equals "Item2 ID match" "$BODY4" ".data.id" "$ITEM2_ID"

print_json "$BODY4"

# ============================================================
# 5. LIST ITEMS
# ============================================================
echo
echo "============================================================"
echo " 5. LIST ITEMS"
echo "============================================================"

RES5=$(curl -s -i "$API/items")
BODY5=$(echo "$RES5" | sed '1,/^\r$/d')

assert_status "List items" "$RES5" "200"

echo "Item IDs in DB:"
echo "$BODY5" | jq -r '.data[].id'

print_json "$BODY5"

# ============================================================
# 6. GET item1
# ============================================================
echo
echo "============================================================"
echo " 6. GET item1"
echo "============================================================"

RES6=$(curl -s -i "$API/items/$ITEM1_ID")
BODY6=$(echo "$RES6" | sed '1,/^\r$/d')

assert_status "Get item1" "$RES6" "200"

assert_json_equals "Name check" "$BODY6" ".data.name" "Laptop"
assert_json_equals "Quantity check" "$BODY6" ".data.quantity" "5"

print_json "$BODY6"

# ============================================================
# 7. UPDATE item1
# ============================================================
echo
echo "============================================================"
echo " 7. UPDATE item1"
echo "============================================================"

RES7=$(curl -s -i \
-X PUT "$API/items/$ITEM1_ID" \
-H "Content-Type: application/json" \
-d '{
  "name":"Laptop Pro",
  "quantity":10
}')

BODY7=$(echo "$RES7" | sed '1,/^\r$/d')

assert_status "Update item1" "$RES7" "200"

assert_json_equals "Updated name" "$BODY7" ".data.name" "Laptop Pro"
assert_json_equals "Updated quantity" "$BODY7" ".data.quantity" "10"

print_json "$BODY7"

# ============================================================
# 8. GET UPDATED item1
# ============================================================
echo
echo "============================================================"
echo " 8. GET UPDATED item1"
echo "============================================================"

RES8=$(curl -s -i "$API/items/$ITEM1_ID")
BODY8=$(echo "$RES8" | sed '1,/^\r$/d')

assert_status "Get updated item1" "$RES8" "200"

assert_json_equals "Updated name check" "$BODY8" ".data.name" "Laptop Pro"
assert_json_equals "Updated quantity check" "$BODY8" ".data.quantity" "10"

print_json "$BODY8"

# ============================================================
# 9. GET item2 (BEFORE DELETE)
# ============================================================
echo
echo "============================================================"
echo " 9. GET item2 (BEFORE DELETE)"
echo "============================================================"

RES9=$(curl -s -i "$API/items/$ITEM2_ID")
BODY9=$(echo "$RES9" | sed '1,/^\r$/d')

print_json "$BODY9"

assert_status "Get item2 before delete" "$RES9" "200"
assert_json_equals "Item2 ID exists" "$BODY9" ".data.id" "$ITEM2_ID"

# ============================================================
# 10. DELETE item2
# ============================================================
echo
echo "============================================================"
echo " 10. DELETE item2"
echo "============================================================"

RES10=$(curl -s -i -X DELETE "$API/items/$ITEM2_ID")
assert_status "Delete item2" "$RES10" "200"

# ============================================================
# 11. GET item2 (AFTER DELETE)
# ============================================================
echo
echo "============================================================"
echo " 11. GET item2 (AFTER DELETE)"
echo "============================================================"

RES11=$(curl -s -i "$API/items/$ITEM2_ID")
BODY11=$(echo "$RES11" | sed '1,/^\r$/d')

print_json "$BODY11"

assert_status "Item2 should be 404" "$RES11" "404"

# ============================================================
# 12. API DOCUMENTATION (SWAGGER UI)
# ============================================================
echo
echo "============================================================"
echo " 12. API DOCUMENTATION (SWAGGER UI)"
echo "============================================================"

RES_DOCS=$(curl -s -i "$API/docs")
HTTP_DOCS=$(echo "$RES_DOCS" | grep -m1 "HTTP/2" | awk '{print $2}')
BODY_DOCS=$(echo "$RES_DOCS" | sed '1,/^\r$/d')

if [ "$HTTP_DOCS" = "200" ]; then
  pass "GET /docs returns 200"
else
  fail "GET /docs status" "200" "$HTTP_DOCS"
fi

if echo "$BODY_DOCS" | grep -q "swagger-ui"; then
  pass "GET /docs returns Swagger UI HTML"
else
  fail "GET /docs content" "swagger-ui HTML" "unexpected content"
fi

RES_OPENAPI=$(curl -s -i "$API/openapi.json")
HTTP_OPENAPI=$(echo "$RES_OPENAPI" | grep -m1 "HTTP/2" | awk '{print $2}')
BODY_OPENAPI=$(echo "$RES_OPENAPI" | sed '1,/^\r$/d')

if [ "$HTTP_OPENAPI" = "200" ]; then
  pass "GET /openapi.json returns 200"
else
  fail "GET /openapi.json status" "200" "$HTTP_OPENAPI"
fi

assert_json_equals "OpenAPI version field" "$BODY_OPENAPI" '.openapi' "3.0.0"

# ============================================================
# 13. FINAL LIST
# ============================================================
echo
echo "============================================================"
echo " 13. FINAL LIST"
echo "============================================================"

RES10=$(curl -s -i "$API/items")
BODY10=$(echo "$RES10" | sed '1,/^\r$/d')

print_json "$BODY10"

# ============================================================
# SUMMARY
# ============================================================
echo
echo "============================================================"
echo " FINAL SUMMARY"
echo "============================================================"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo "Total: $TOTAL"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo "ALL TESTS PASSED"
  exit 0
else
  echo "SOME TESTS FAILED"
  exit 1
fi
