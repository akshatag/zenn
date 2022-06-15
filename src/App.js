import React, { useState, useEffect, useMemo } from 'react';
import Editor from './Components/Editor';
import Login from './Components/Login';
import List from './Components/List';
import View from './Components/View';
import { supabase } from './supabaseClient';
import {
  BrowserRouter as Router,
  Navigate,
  Switch,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import { ChakraProvider, Button } from '@chakra-ui/react';
import theme from './theme.js';
import './App.css'


function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    setSession(supabase.auth.session())

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    const script = document.createElement("script");
    script.src = "http://localhost:3000/charm.js";
    script.async = true;
    document.body.appendChild(script);
  }, [])
    
  return (
    <ChakraProvider theme={theme}>
      {!session ? 
        <Router>
          <Routes>
            <Route path="/login" element={<Login/>} ></Route>
            <Route path="*" element={<Navigate to="/login"/>}/>
          </Routes>
        </Router>
        :
        <> 
          <Router> 
            <Routes>
              <Route path="/posts" element={<List/>}/>
              <Route path="/editor" element={<Editor/>}/>
              <Route path="/editor/:postId" element={<Editor/>} />
              <Route path="/view/:postId" element={<View/>} />
              <Route path="*" element={<Navigate to="/posts"/>} />
            </Routes>
          </Router>
        </>
      }
    </ChakraProvider>
  )
}

export default App;
