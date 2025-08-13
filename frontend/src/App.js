import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  return (
    <div>
      <header className="App-header">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-8">Mainframe Doc Generator</h1>
          <p className="text-lg mb-8">Create easy-to-read documentation from Mainframe JCL, PROC and COBOL, ASM, or PL/I code.</p>
          <div className="space-y-4">
            <a
              href="/mainframe-doc-generator.html"
              className="inline-block bg-green-500 hover:bg-green-600 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Open Mainframe Doc Generator
            </a>
            <div className="text-sm text-green-300 max-w-2xl mx-auto">
              <p className="mb-3">🚀 <strong>Now with Google Gemini AI Integration!</strong></p>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <p className="text-green-400 font-semibold mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1 text-green-300">
                  <li>✅ Google Gemini 2.0 Flash API</li>
                  <li>✅ Optional Inputs (Any combination)</li>
                  <li>✅ Node.js Backend</li>
                  <li>✅ Enhanced Show Around Modal</li>
                  <li>✅ Mobile-Responsive Design</li>
                </ul>
                <p className="text-green-400 font-semibold mt-4 mb-2">Status:</p>
                <p className="text-xs text-green-300">
                  ✅ Backend: Node.js Express Server<br/>
                  ✅ AI: Google Gemini 2.0 Flash<br/>
                  ✅ All inputs now optional
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

// API Proxy route to handle Node.js backend requests
const ApiProxy = () => {
  useEffect(() => {
    // Redirect API requests to Node.js backend
    const path = window.location.pathname.replace('/api-proxy', '');
    const backendUrl = `http://localhost:8002/api${path}`;
    
    fetch(backendUrl)
      .then(response => response.json())
      .then(data => {
        document.body.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(error => {
        document.body.innerHTML = `<pre>Error: ${error.message}</pre>`;
      });
  }, []);

  return <div>Loading...</div>;
};

// Mainframe Doc Generator Component (renders the HTML content)
const MainframeGenerator = () => {
  useEffect(() => {
    // Redirect to the HTML file
    window.location.href = '/mainframe-doc-generator.html';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl text-green-400 mb-4">Redirecting to Mainframe Doc Generator...</h2>
        <p className="text-green-300">
          If you're not redirected automatically, 
          <a href="/mainframe-doc-generator.html" className="text-green-400 underline ml-2">
            click here
          </a>
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mainframe" element={<MainframeGenerator />} />
          <Route path="/api-proxy/*" element={<ApiProxy />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
