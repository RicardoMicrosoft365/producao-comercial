"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import { FaChartBar, FaHome, FaChevronDown } from 'react-icons/fa';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative z-10">
      {/* Efeito de brilho de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-800/5 blur-xl opacity-70 -z-10"></div>
      
      {/* Barra de header principal */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-30"></div>
                <div className="relative">
                  <h1 className="text-2xl sm:text-3xl">
                    <span className="font-bold text-primary">Boost</span>
                    <span className="font-light text-secondary ml-1">Comercial</span>
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Menu para desktop */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8 items-center">
                <li>
                  <Link href="/" className="flex items-center space-x-1 py-2 px-3 rounded-md hover:bg-gray-800 transition-all group">
                    <FaHome className="text-primary group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white transition-colors">Início</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/analise-volumetria" 
                    className="flex items-center space-x-1 py-2 px-3 rounded-md hover:bg-gray-800 transition-all group"
                  >
                    <FaChartBar className="text-primary group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white transition-colors">Análise de Volumetria</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/analise-volumetria" 
                    className="flex items-center bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <FaChartBar className="mr-2" /> Ver Análise
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Botão de menu para mobile */}
            <button 
              className="md:hidden flex flex-col space-y-1.5 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className={`block w-6 h-0.5 bg-white transform transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-6 h-0.5 bg-white transform transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <div className={`md:hidden bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 shadow-lg transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="container mx-auto px-4 py-3">
          <ul className="space-y-4 pb-4">
            <li>
              <Link 
                href="/" 
                className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-800 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaHome className="text-primary" />
                <span>Início</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/analise-volumetria" 
                className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-800 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaChartBar className="text-primary" />
                <span>Análise de Volumetria</span>
              </Link>
            </li>
            <li className="pt-2">
              <Link 
                href="/analise-volumetria" 
                className="flex items-center justify-center bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all shadow-md hover:shadow-lg w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaChartBar className="mr-2" /> Ver Análise
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header; 