<div align="center">
  <h1>🏠 PrakashAI - Intelligent Smart Home Energy Management System</h1>
  <h3>🧠 AI-Powered Smart Home Automation & Energy Optimization</h3>
  <p>🤖 Advanced machine learning algorithms for intelligent energy management and automated routine creation</p>
  
  <p>
    🎤 <strong>Multilingual Voice Assistant</strong> • 
    📊 <strong>Predictive Analytics</strong> • 
    🔄 <strong>Autonomous Routines</strong> • 
    ⚡ <strong>Real-time Optimization</strong> • 
    🌍 <strong>Environmental Impact</strong> • 
    📱 <strong>Mobile Ready</strong>
  </p>
  
  <p>
    <strong>🔮 Powered by Google Gemini AI</strong> | 
    <strong>⚛️ React 18 + TypeScript</strong> | 
    <strong>🚀 Node.js Backend</strong> | 
    <strong>🎨 Tailwind CSS</strong>
  </p>
</div>

---

**PrakashAI** is powered by our proprietary artificial intelligence system that combines multiple machine learning models to create the most intelligent smart home experience:

### 🤖 Core AI Features

- **� Prcedictive Energy Analytics**: Our ML models analyze usage patterns to predict and optimize energy consumption
- **🔄 Autonomous Routine Generation**: AI automatically creates and suggests energy-saving routines based on your lifestyle
- **📊 Behavioral Learning**: Advanced algorithms learn from your daily habits to proactively manage appliances
- **🗣️ Multilingual Voice AI**: Natural language processing in 6+ languages with cultural awareness
- **⚡ Real-time Optimization**: Continuous learning algorithms that adapt to changing usage patterns
- **🔍 Anomaly Detection**: Smart detection of unusual energy consumption patterns and device malfunctions

### 🧮 Machine Learning Models

Our system employs several specialized ML models:

1. **Energy Consumption Predictor**: Time-series forecasting model that predicts future energy usage
2. **Routine Recommendation Engine**: Collaborative filtering and pattern recognition for optimal automation
3. **Behavioral Analysis Model**: Deep learning model that understands user preferences and habits
4. **Voice Command Processor**: NLP model with multilingual support and intent recognition
5. **Anomaly Detection System**: Unsupervised learning for identifying unusual patterns
6. **Load Balancing Optimizer**: Reinforcement learning for optimal appliance scheduling

---

## 🌟 Key Features

### 🎤 Advanced Voice Assistant
- **Multilingual Support**: English, Hindi, Spanish, French, German, and more
- **Cultural Awareness**: Uses proper honorifics and respectful language (आप, sir/madam, etc.)
- **Real Device Control**: Controls actual virtual appliances with voice commands
- **Natural Language Processing**: Powered by Google's Gemini AI with our custom training

### 📊 Intelligent Dashboard
- **Real-time Energy Monitoring**: Live consumption analytics with ML-powered insights
- **Predictive Analytics**: AI-driven forecasts for energy usage and costs
- **Smart Recommendations**: Personalized suggestions for energy optimization
- **Interactive Visualizations**: Beautiful charts and graphs powered by Recharts

### 🔄 Autonomous Routine Management
- **AI-Generated Routines**: Our ML algorithms create optimal automation schedules
- **Learning Adaptation**: Routines evolve based on your usage patterns
- **Energy Optimization**: Automatic load balancing and peak-hour management
- **Seasonal Adjustments**: AI adapts to weather and seasonal changes

### 🏠 Smart Appliance Control
- **Virtual Appliance System**: Comprehensive device simulation and control
- **Real-time State Management**: Instant synchronization across all interfaces
- **Energy Tracking**: Detailed consumption monitoring per device
- **Predictive Maintenance**: AI-powered alerts for device health

---

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for modern, responsive design
- **Framer Motion** for smooth animations and transitions
- **Recharts** for interactive data visualizations
- **Vite** for lightning-fast development and builds

### Backend & AI
- **Node.js** with Express for robust API services
- **Google Gemini AI** for advanced natural language processing
- **Custom ML Models** for energy prediction and optimization
- **Real-time WebSocket** connections for live updates
- **JSON-based Data Storage** with plans for database migration

### Mobile
- **React Native** with Expo for cross-platform mobile apps
- **TypeScript** for consistent development experience
- **Native device integration** for optimal performance

---

## � AI-cPowered Capabilities

### 🔮 Predictive Intelligence
Our AI system continuously learns from your energy usage patterns to:
- Predict optimal times for running high-energy appliances
- Suggest energy-saving opportunities
- Automatically adjust settings based on weather and occupancy
- Provide accurate energy cost forecasts

### 🎨 Personalized Experience
The machine learning models create a unique experience for each user:
- **Adaptive Interface**: UI adjusts based on your most-used features
- **Smart Notifications**: AI determines the best times to send alerts
- **Contextual Suggestions**: Recommendations based on time, weather, and usage patterns
- **Learning Preferences**: System remembers and applies your choices automatically

### 🌍 Environmental Impact
Our AI helps reduce your carbon footprint through:
- **Optimal Energy Distribution**: Load balancing to minimize waste
- **Renewable Energy Integration**: Smart scheduling during peak solar/wind generation
- **Carbon Footprint Tracking**: AI-calculated environmental impact metrics
- **Sustainability Recommendations**: Personalized tips for greener living

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with JavaScript enabled

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prakash-ai.git
   cd prakash-ai
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd "Web Application"
   npm install
   
   # Backend
   cd backend
   npm install
   ```

3. **Start the development servers**
   ```bash
   # Option 1: Use our automated script (Windows)
   start-full-system.bat
   
   # Option 2: Manual startup
   # Terminal 1 - Backend
   cd backend
   node index.js
   
   # Terminal 2 - Frontend
   cd ..
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Voice Demo: http://localhost:5173/voice-demo

### 🎤 Voice Assistant Setup
1. Navigate to `/voice-demo` page
2. Enter your Gemini API key in settings
3. Grant microphone permissions
4. Start controlling your smart home with voice commands!

---

## 🎮 Usage Examples

### Voice Commands (Multilingual)

**English:**
- "Please turn on the ceiling fan"
- "What's my energy usage today?"
- "Create a morning routine"

**Hindi:**
- "आप पंखा चालू कर दीजिए" (Please turn on the fan)
- "आज का बिजली का बिल बताइए" (Tell me today's electricity bill)

**Spanish:**
- "Por favor, enciende el ventilador"
- "¿Cuál es mi consumo de energía?"

### API Integration
```javascript
// Get energy consumption data
const response = await fetch('/api/consumption/overview');
const data = await response.json();

// Control appliances
await fetch('/api/appliances/fan/toggle', { method: 'POST' });

// Get AI recommendations
const suggestions = await fetch('/api/ai/recommendations');
```

---

## 🔧 Configuration

### Environment Variables
```env
# Backend Configuration
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_VOICE=true
```

### AI Model Configuration
The AI models can be fine-tuned through the configuration files:
- `src/config/ai.config.ts` - Voice assistant and NLP settings
- `backend/config/ml.config.js` - Machine learning model parameters
- `backend/config/energy.config.js` - Energy optimization settings

---

## 📱 Mobile App

The Prakash AI mobile application provides full access to your smart home system:

- **Native Performance**: Built with React Native for optimal mobile experience
- **Offline Capabilities**: Core features work without internet connection
- **Push Notifications**: AI-powered alerts and recommendations
- **Biometric Security**: Fingerprint and face recognition support

---

## 🤝 Contributing

We welcome contributions to make Prakash AI even more intelligent! Please read our contributing guidelines and feel free to submit pull requests.

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for AI features
- Document any new ML model implementations
- Ensure accessibility compliance

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering our natural language processing
- **Open Source Community** for the amazing libraries and tools
- **Our Beta Testers** for helping improve the AI algorithms
- **Environmental Organizations** for inspiring our sustainability focus

---

<div align="center">
  <h3>🌟 Experience the Future of Smart Home AI</h3>
  <p>Prakash AI - Where Artificial Intelligence Meets Sustainable Living</p>
</div>