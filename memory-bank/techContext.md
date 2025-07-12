# Tech Context: AIgent Pro

## Core Technology Stack

### Frontend
- **React 19** - Latest version with modern features
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Electron** - Cross-platform desktop application

### Backend & Services
- **Firebase** - Authentication, Firestore database, cloud functions
- **Groq** - AI model inference (primary)
- **OpenAI** - AI model inference (fallback)
- **LangChain** - AI workflow orchestration

### Development Tools
- **Vite** - Fast build tool and development server
- **Biome** - Code formatting and linting
- **TypeScript** - Static type checking

## Project Structure

```
AIgent Pro/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   ├── preload/        # Electron preload scripts
│   └── lib/            # Shared libraries
├── memory-bank/        # Project documentation
├── docs/               # Technical documentation
└── tasks/              # Development tasks
```

## Development Environment

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup Commands
```bash
git clone https://github.com/RealEstateAgentic/RealEstateAgentic.git
cd RealEstateAgentic
npm install
npm run dev
``` 