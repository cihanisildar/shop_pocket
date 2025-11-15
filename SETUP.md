# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be fully initialized
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key

3. **Create Environment File**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set Up Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire contents of `supabase-schema.sql`
   - Click "Run" to execute the SQL script
   - This will create all necessary tables and security policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Your Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configure Google OAuth

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials (Client ID and Client Secret)
   - Get these from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials if you don't have them
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Save the configuration

## First Steps

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Upload Excel**: On the dashboard, upload your Excel file (like the example file provided)
3. **Create List**: Click "New List" to create your first list
4. **Add Items**: Search for items, select multiple, and add them to your list

## Excel File Format

Your Excel file should have columns with headers that include:
- **Code**: Column header containing "kod", "code", or "kodu"
- **Name**: Column header containing "ad", "name", "isim", "ürün", or "product"
- **Category** (optional): Column header containing "kategori" or "category"
- **Price** (optional): Column header containing "fiyat", "price", or "tutar"
- **Unit** (optional): Column header containing "birim" or "unit"

The parser will automatically detect these columns regardless of their position in the spreadsheet.

## Troubleshooting

### Authentication Issues
- Make sure your Supabase project is active
- Verify your environment variables are correct
- Check that email confirmation is disabled in Supabase Auth settings (for development)

### Database Issues
- Ensure you've run the SQL schema script
- Check that Row Level Security (RLS) policies are created
- Verify your database tables exist in the Supabase dashboard

### Excel Upload Issues
- Make sure your Excel file has headers in the first row
- Verify the file format is .xlsx or .xls
- Check that at least "code" and "name" columns exist

### Build Issues
- Clear `.next` folder and `node_modules`, then reinstall:
  ```bash
  rm -rf .next node_modules
  npm install
  ```

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set environment variables** in your hosting platform (Vercel, Netlify, etc.)

3. **Deploy** following your platform's instructions

## Support

If you encounter any issues, check:
- Supabase dashboard for database errors
- Browser console for client-side errors
- Terminal/console for server-side errors

