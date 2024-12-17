## Project Setup

- Create a .env file with your MySQL connection string:
```bash
DATABASE_URL="mysql://user:password@localhost:3306/todo_db"
```

- Install dependencies:
```bash
npm install
```

- Run Prisma migrations:
```bash
npx prisma migrate dev
```

- Start the server:
```bash
npm run dev
```