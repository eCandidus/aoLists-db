
echo off

set ip=localhost:42324
rem set ip=10.0.188.196:42324

echo Testing util...
curl -u admin: http://%ip%/util/hash/aasecretphrase 
echo .

echo User list
curl -u admin: http://%ip%/users 
echo .
echo Add user...
curl -u admin: http://%ip%/users/jose/xyz 
echo .
echo Add another user...
curl -u admin: http://%ip%/users/sam/bad 
echo .
echo Remove user...
curl -u admin: -X DELETE http://%ip%/users/sam 
echo .
echo User list
curl -u admin: http://%ip%/users 
echo .

echo Testing user authentication - query...
curl http://%ip%/users?u=admin 
echo .
echo cUrl -d...
curl -d "u=jose&p=xyz" -G "http://%ip%/users" 
echo .
echo Basic auth...
curl -u jose:xyz http://%ip%/users 
echo .
echo Validate (should return ok)
curl -u admin: http://%ip%/users/jose/xyz/validate 
echo .
echo Validate (should return fail)
curl -u admin: http://%ip%/users/jose/xys/validate 
echo .

echo Notifications (add)...
curl -u admin: -d "{ \"to\": \"samson\", \"msg\": \"The brown fox jumped over the moon\" }" http://%ip%/noti
echo.
echo Notifications (retrieve)...
curl -u admin: http://%ip%/noti
echo.

echo List databases...
curl -u admin: http://%ip%/ 
echo .

echo Create a database...
curl -u admin: -d "{ \"_desc\": \"My temporary database\" }" --header "Content-Type: application/json" --url http://%ip%/tempdb/metadata 
echo .
echo Get the metadata for a database...
curl -u admin: http://%ip%/tempdb/metadata 
echo .
echo Create a collection and set the metadata...
curl -u admin: -d "{ \"_desc\": \"My temporary collection\", \"indexes\": [ \"field\" ] }" --header "Content-Type: application/json" --url http://%ip%/tempdb/tempcoll/metadata 
echo .
echo Get the metadata for a collection...
curl -u admin: -u admin: http://%ip%/tempdb/tempcoll/metadata 
echo .
echo List all collections with metadata
curl -u admin: -u admin: http://%ip%/allmetadata 
echo .
echo Upload document...
curl -u admin: -d "{ \"_id\": \"jose\", \"_desc\": \"my record 1\" }" --header "Content-Type: application/json" --url http://%ip%/tempdb/tempcoll 
echo .
echo Delete a collection's metadata...
curl -u admin: -X DELETE http://%ip%/tempdb/tempcoll/metadata 
echo .
echo Delete a collection...
curl -u admin: -X DELETE http://%ip%/tempdb/tempcoll 
echo .
echo Delete a database...
curl -u admin: -X DELETE http://%ip%/tempdb 
echo .

echo List collections...
curl -u admin: http://%ip%/local 
echo .

echo List documents...
curl -u admin: http://%ip%/local/test 
echo .

echo Delete a collection...
curl -u admin: -X DELETE http://%ip%/local/test 
echo .
echo Upload document...
curl -u admin: -d "{ \"_id\": \"jose\", \"_desc\": \"my record 1\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .
echo Retrieve document...
curl -u admin: http://%ip%/local/test/jose 
echo .
echo Upload document...
curl -u admin: -d "{ \"_id\": \"walkingdead\", \"_desc\": \"my record 2\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .
echo Delete document...
curl -u admin: -X DELETE http://%ip%/local/test/walkingdead 
echo .
echo Retrieve document...
curl -u admin: http://%ip%/local/test/walkingdead 
echo .

echo Setting up for attachments
curl -u admin: -X DELETE http://%ip%/local/test 
echo .
curl -u admin: -d "{ \"_id\": \"jose\", \"_desc\": \"my record 1\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .
curl -u admin: -d "{ \"_id\": \"test\", \"_desc\": \"my record 5\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .
curl -u admin: -d "{ \"_id\": \"123456789012345678901234567890123456789012345678901234567890\", \"_desc\": \"my record 3\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .
curl -u admin: -d "{ \"_id\": \"53936742aeea600e64e8bb32\", \"_desc\": \"my record 4\" }" --header "Content-Type: application/json" --url http://%ip%/local/test 
echo .

echo find query
curl -u admin: -d "o=find" -G http://%ip%/local/test 
echo .
echo findOne query
curl -u admin: -d "o=findone" -G http://%ip%/local/test 
echo .
echo distinct query
curl -u admin: -d "o=distinct" -G http://%ip%/local/test 
echo .
echo count query
curl -u admin: -d "o=count" -G http://%ip%/local/test 
echo .
echo keys query
curl -u admin: -d "o=keys" -G http://%ip%/local/test 
echo .
echo idcoll query
curl -u admin: -d "o=idcoll" -G http://%ip%/local/test 
echo .
echo csv query
curl -u admin: -d "o=csv" -G http://%ip%/local/test 
echo .

echo Attaching...
curl -u admin: http://%ip%/local/test/jose/attach/local/test/test/employer 
echo .
curl -u admin: http://%ip%/local/test/jose/attach/local/test/123456789012345678901234567890123456789012345678901234567890/employer 
echo .
curl -u admin: http://%ip%/local/test/jose/attach/local/test/123456789012345678901234567890123456789012345678901234567890/insured  
echo .
curl -u admin: http://%ip%/local/test/test/attach/local/test/53936742aeea600e64e8bb32 
echo .
curl -u admin: http://%ip%/local/test/test/attach/local/test/jose 
echo .
curl -u admin: http://%ip%/local/test/53936742aeea600e64e8bb32/attach/local/test/jose 
echo .
curl -u admin: http://%ip%/local/test/jose/attach/local/test/jose 
echo .

echo Get attached...
curl -u admin: http://%ip%/local/test/jose/attached 
echo .

echo Detach...
curl -u admin: http://%ip%/local/test/jose/detach/local/test/jose 
echo .

echo Get attached #2...
curl -u admin: http://%ip%/local/test/jose/attached 
echo .

echo Get attached employer...
curl -u admin: http://%ip%/local/test/jose/attached/employer 
echo .

echo Get attached to 
curl -u admin: http://%ip%/local/test/jose/attachedto 
echo .

echo Get where used
curl -u admin: http://%ip%/local/test/jose/whereused/test 
echo .

echo Get AO
curl -u admin: http://%ip%/local/test/jose/ao 
echo .

echo aoList System
echo .
echo Setting metadata for calling user...
curl -u jose:xyz -d "{ \"userName\": \"Jose Gonzalez\", \"userTheme\": null, \"FYIEnabled\": true, \"AllowUpload\": true, \"collectionsAllowed\": [ \"local.ttd.av\", \"local.charts.avd\" ] }" --header "Content-Type: application/json" --url http://%ip%/metadata 
echo .
echo Extending metadata for calling user...
curl -u jose:xyz -d "{ \"extension\": \"The brown cow jumped over the lazy moon\" }" --header "Content-Type: application/json" --url http://%ip%/metadata/set 
echo .
echo Getting metadata for the calling user...
curl -u jose:xyz --url http://%ip%/metadata 
echo.
echo Extending metadata for calling user ...
curl -u jose:xyz -d "{ \"extension\": \"The extensions for Cathy\" }" --header "Content-Type: application/json" --url http://%ip%/users/cathy/metadata/set 
echo .
echo Getting metadata...
curl -u jose:xyz --url http://%ip%/users/cathy/metadata 
echo.

echo List collections...
curl -u admin: http://%ip%/local 
echo . 

echo Create Things to Do...
curl -u admin: -d "{ \"_desc\": \"Things to Do\" }" --header "Content-Type: application/json" --url http://%ip%/local/ttd/metadata 
echo .

echo Create Appointments...
curl -u admin: -d "{ \"_desc\": \"Appointments\" }" --header "Content-Type: application/json" --url http://%ip%/local/appointments/metadata  
echo .

echo Create Phone Messages...
curl -u admin: -d "{ \"_desc\": \"Phone Messages\" }" --header "Content-Type: application/json" --url http://%ip%/local/phonemsgs/metadata 
echo .

echo Create Charts
curl -u admin: -d "{ \"_desc\": \"Patient Charts\", \"icon\": \"workproduct\" }" --header "Content-Type: application/json" --url http://%ip%/local/charts/metadata 
echo .

rem pause
exit