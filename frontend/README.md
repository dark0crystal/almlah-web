claude rules:

i am using next-intl so update the pages translation for static data and give me the ar.json and en.json


How to start the frontend:
 - cd frontend
 - npm run dev

Requirements for frontend:
node 22


media-bucket/
├── places/
│   ├── {place-id}/
│   │   ├── cover.jpg (or cover.{ext})
│   │   ├── gallery/
│   │   │   ├── 001.jpg
│   │   │   ├── 002.jpg
│   │   │   └── 003.jpg
│   │   └── content-sections/
│   │       ├── {section-id}/
│   │       │   ├── 001.jpg
│   │       │   └── 002.jpg
├── governates/
│   ├── {governate-id}/
│   │   ├── cover.jpg
│   │   └── gallery/ 
├── wilayahs/
│   ├── {wilayah-id}/
│   │   ├── cover.jpg
│   │   └── gallery/
└── temp/ (for uploads before processing)


