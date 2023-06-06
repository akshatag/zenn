import React, { useState, useEffect, useMemo } from 'react';
import Editor from './Components/Editor';
import Login from './Components/Login';
import List from './Components/List';
import About from './Components/About'
import MobileRedirect from './Components/MobileRedirect'
import { isMobile } from 'react-device-detect';
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
  }, [])
    
  if(isMobile) {
    return (
      <ChakraProvider theme={theme}>
          <Router>
            <Routes>
              <Route path="/mobile" element={<MobileRedirect/>}/>
              <Route path="/about" element={<About/>}/>
              <Route path="*" element={<Navigate to="/mobile"/>}/>
            </Routes>
          </Router>
      </ChakraProvider>
    )
  }

  return (
    <ChakraProvider theme={theme}>

      {!session ? 
        <Router>
          <Routes>
            <Route path="/login" element={<Login/>} ></Route>
            <Route path="/about" element={<About/>}/>
            <Route path="*" element={<Navigate to="/login"/>}/>
          </Routes>
        </Router>
        :
        <> 
          <Router> 
            <Routes>
              <Route path="/posts" element={<List/>}/>
              <Route path="/editor" element={<Editor/>}/>
              <Route path="/edit/:postId" element={<Editor/>}/>
              <Route path="/view/:postId" element={<Editor readOnly/>}/>
              <Route path="*" element={<Navigate to="/posts"/>}/>
            </Routes>
          </Router>
        </>
      }
    </ChakraProvider>
  )
}

export default App;
