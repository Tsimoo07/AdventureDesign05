# AdventureDesign05  
어벤디 앱  

SSH 링크 :    
git@github.com:Tsimoo07/AdventureDesign05.git  

로컬 서버 열기 (터미널 닫으면 미작동)  
npx json-server db.json --port 3000  

로컬 테스트 (터미널)  
npm run dev  
후 나오는 링크 실행  

데이터 형식  
{  
  "statuses": [  
    { "id": "1", "label": "양식", "value": 81}, //번호, 구역이름, 인구수  
    { "id": "2", "label": "한식", "value": 72},  
    { "id": "3", "label": "일식", "value": 32},  
    { "id": "4", "label": "중식", "value": 100}  
  ]  
}  