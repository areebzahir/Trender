# 🏠 Trender - AI Furniture Expert

> Discover furniture that matches your unique style. Upload your room, swipe through AI-curated pieces, and create the perfect space you've always dreamed of.

## ✨ Features

- **🎨 Style Discovery**: Upload room photos or take a visual quiz to discover your design aesthetic
- **🤖 AI-Powered Recommendations**: Powered by Qloo's cultural intelligence and Google's Gemini AI
- **📱 Swipe Interface**: Tinder-style swiping for furniture discovery
- **🛋️ Personalized Curation**: Get furniture recommendations tailored to your taste profile
- **💫 Beautiful UI**: Modern, responsive design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for Qloo and Google Gemini

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Haaziq-code/Trender.git
   cd Trender
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   VITE_QLOO_API_KEY=your_qloo_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 🔑 API Keys Setup

### Qloo API Key
1. Visit [Qloo Developers](https://qloo.com/developers)
2. Sign up for an account
3. Create a new project
4. Copy your API key to `VITE_QLOO_API_KEY`

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy your API key to `VITE_GEMINI_API_KEY`

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── LandingPage.tsx # Main landing page
│   ├── ChoicePage.tsx  # Style discovery options
│   ├── RoomUpload.tsx  # Room photo upload
│   ├── StyleQuiz.tsx   # Visual style quiz
│   └── EnhancedSwipeInterface.tsx # Furniture swiping
├── services/           # API services
│   ├── qlooApi.ts     # Qloo integration
│   ├── geminiService.ts # Google Gemini integration
│   └── gptService.ts  # AI text generation
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
└── pages/             # Page components
```

## 🎨 Design System

Trender uses a sophisticated design system with:

- **Typography**: Inter (body) + Playfair Display (headings)
- **Colors**: Warm terracotta primary with sage green accents
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design approach

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Set environment variables in Vercel dashboard

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **AI APIs**: Qloo, Google Gemini
- **Deployment**: Netlify/Vercel ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Qloo](https://qloo.com) for cultural intelligence API
- [Google Gemini](https://ai.google.dev) for AI vision capabilities
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Unsplash](https://unsplash.com) for furniture photography

