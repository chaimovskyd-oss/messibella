# Messibella Digital Catalog Book

פרויקט React/Vite מוכן כבסיס לקטלוג דיגיטלי בסגנון ספר/מגזין.

## מה יש בפנים

- קטלוג בעיצוב ספר/מגזין
- תוכן עניינים לחיץ
- פרקים לפי קטגוריות מתוך `catalog.json`
- כרטיסי מוצרים
- חיפוש
- כפתור וואטסאפ
- תמיכה בנתיבי תמונות מתוך `local_filename`
- קבצי data בתוך `public/data`

## חשוב לגבי תמונות

הקוד מחפש תמונות לפי `local_filename`, לדוגמה:

```text
images\\khvltsh-lrkb-main-1.png
```

וזה הופך אוטומטית ל:

```text
/images/khvltsh-lrkb-main-1.png
```

לכן התמונות עצמן צריכות להיות בתיקייה:

```text
public/images/
```

אם עדיין אין שם את כל התמונות, תעתיק לשם את תיקיית התמונות שחילצת מהמיגרציה.

## התקנה והרצה

```bash
npm install
npm run dev
```

פתיחה בדפדפן:

```text
http://localhost:5173
```

## בנייה לפרודקשן

```bash
npm run build
```

## העלאה ל־GitHub/Vercel

אחרי שהכל עובד:

```bash
git add .
git commit -m "Add digital catalog book"
git push
```

אם Vercel מחובר לריפו, הוא יבנה לבד deployment חדש.
