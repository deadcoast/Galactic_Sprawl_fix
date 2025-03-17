#!/bin/bash

# Fix specific variables in test file
TEST_FILE="Tests/test_unused_vars.ts"
echo "Fixing unused variables in $TEST_FILE"

# Fix options parameter in processData function
sed -i.bak 's/data: any, options: any/data: any, _options: any/g' $TEST_FILE
echo "Fixed options parameter"

# Fix count variable in calculateTotal function
sed -i.bak 's/const count = prices.length/const _count = prices.length/g' $TEST_FILE
echo "Fixed count variable"

# Fix email parameter in getUserInfo function
sed -i.bak 's/name, age, email/name, age, _email/g' $TEST_FILE
echo "Fixed email parameter"

# Fix length variable in getFirstItem function
sed -i.bak 's/const length = items.length/const _length = items.length/g' $TEST_FILE
echo "Fixed length variable"

# Fix config property in DataProcessor class
sed -i.bak 's/private config: any;/private _config: any;/g' $TEST_FILE
echo "Fixed config property"

# Fix index parameter in callback
sed -i.bak 's/(item, index) => {/(item, _index) => {/g' $TEST_FILE
echo "Fixed index parameter"

# Fix error in catch block
sed -i.bak 's/catch (error)/catch (_error)/g' $TEST_FILE
echo "Fixed error variable"

# Fix city variable in destructuring
sed -i.bak 's/name, age, city/name, age, _city/g' $TEST_FILE
echo "Fixed city variable"

echo "All fixes applied successfully" 