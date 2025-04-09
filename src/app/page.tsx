import React from 'react';
import Header from '../components/Header';
import { FaChartBar, FaCalendarDay, FaCalendarAlt, FaMoneyBillWave, FaTools } from 'react-icons/fa';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-primary">Boost</span>
            <span className="text-secondary ml-2 font-light">Comercial</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Plataforma de análise avançada para visualização e processamento de dados comerciais
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="text-primary text-5xl mb-4 flex justify-center">
              <FaChartBar />
            </div>
            <h3 className="text-xl font-semibold mb-2">Análise de Volumetria</h3>
            <p className="text-gray-400">
              Analise o volume de dados por diferentes dimensões e métricas
            </p>
            <div className="mt-4">
              <Link href="/analise-volumetria" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                <FaChartBar className="mr-1" /> Ver Análise
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute -right-8 top-4 bg-amber-600 text-white px-10 py-1 transform rotate-45 shadow-md">
              <span className="text-xs font-semibold">Em Desenvolvimento</span>
            </div>
            <div className="text-primary text-5xl mb-4 flex justify-center">
              <FaCalendarDay />
            </div>
            <h3 className="text-xl font-semibold mb-2">Backlog Diário</h3>
            <p className="text-gray-400">
              Acompanhe o status diário de pedidos e pendências
            </p>
            <div className="mt-4">
              <Link href="/backlog-diario" className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                <FaCalendarDay className="mr-1" /> Visualizar Prévia
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute -right-8 top-4 bg-amber-600 text-white px-10 py-1 transform rotate-45 shadow-md">
              <span className="text-xs font-semibold">Em Desenvolvimento</span>
            </div>
            <div className="text-primary text-5xl mb-4 flex justify-center">
              <FaCalendarAlt />
            </div>
            <h3 className="text-xl font-semibold mb-2">Backlog Mensal</h3>
            <p className="text-gray-400">
              Visualize a evolução mensal de pedidos e entregas
            </p>
            <div className="mt-4">
              <Link href="/backlog-mensal" className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                <FaCalendarAlt className="mr-1" /> Visualizar Prévia
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute -right-8 top-4 bg-amber-600 text-white px-10 py-1 transform rotate-45 shadow-md">
              <span className="text-xs font-semibold">Em Desenvolvimento</span>
            </div>
            <div className="text-primary text-5xl mb-4 flex justify-center">
              <FaMoneyBillWave />
            </div>
            <h3 className="text-xl font-semibold mb-2">Faturamento</h3>
            <p className="text-gray-400">
              Acompanhe métricas de faturamento e desempenho financeiro
            </p>
            <div className="mt-4">
              <Link href="/faturamento" className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
                <FaMoneyBillWave className="mr-1" /> Visualizar Prévia
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 text-center">
          <button className="bg-primary hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-full text-lg transition-all shadow-lg hover:shadow-xl">
            Comece Agora
          </button>
        </section>
      </div>
    </main>
  );
} 