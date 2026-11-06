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
  "categories": [  
    {  
      "id": "1",  
      "label": "1학생회관",  
      "items": [  
        { "id": "1-1", "label": "양식", "value": 81, "level": "danger" },  
        { "id": "1-2", "label": "중식", "value": 40, "level": "normal" },  
        { "id": "1-3", "label": "일식", "value": 55, "level": "warning" }  
      ]  
    },  
    {  
      "id": "2",  
      "label": "2학생회관",  
      "items": [  
        { "id": "2-1", "label": "학생식", "value": 20, "level": "normal" },  
        { "id": "2-2", "label": "교직원식", "value": 25, "level": "normal" }  
      ]  
    }  
  ]  
}  