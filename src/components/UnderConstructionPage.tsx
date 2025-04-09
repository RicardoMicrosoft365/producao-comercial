"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';

const UnderConstructionPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configuração do canvas
    canvas.width = 320;
    canvas.height = 240;
    ctx.imageSmoothingEnabled = false;
    
    // Escala de pixels
    const scale = 2;
    
    // Cores
    const colors = {
      background: '#0B1126',
      backgroundGrid: '#1E3163',
      robotBody: '#5584B3',
      robotHead: '#71A9D3',
      robotEye: '#E5F2F8',
      robotArm: '#4A73A0',
      robotHighlight: '#9CCAE0',
      screenBorder: '#344966',
      screenFrame: '#0D1B2A',
      screenInside: '#1B263B',
      iconBlue: '#4682B4',
      iconGreen: '#3CB371',
      iconYellow: '#FFD700',
      iconRed: '#FF6347',
      pixelGlow: '#45B7D1'
    };
    
    // Estado da animação
    let frame = 0;
    let animationFrameId: number;
    
    // Robô
    const robot = {
      x: 50,
      y: 140,
      width: 20,
      height: 30,
      armX: 65,
      armY: 145,
      armTargetX: 65,
      armTargetY: 145,
      holding: false,
      currentPart: -1
    };
    
    // Partes do desktop
    const desktopParts = [
      { x: 180, y: 80, width: 100, height: 80, color: colors.screenInside, placed: false, frame: 50 },  // Tela base
      { x: 176, y: 76, width: 108, height: 88, color: colors.screenBorder, placed: false, frame: 100 }, // Moldura
      { x: 190, y: 90, width: 16, height: 16, color: colors.iconBlue, placed: false, frame: 150 },     // Ícone 1
      { x: 210, y: 90, width: 16, height: 16, color: colors.iconGreen, placed: false, frame: 200 },    // Ícone 2
      { x: 230, y: 90, width: 16, height: 16, color: colors.iconYellow, placed: false, frame: 250 },   // Ícone 3
      { x: 190, y: 115, width: 70, height: 8, color: colors.iconRed, placed: false, frame: 300 },      // Barra de progresso
      { x: 190, y: 130, width: 70, height: 20, color: 'rgba(30, 49, 99, 0.3)', placed: false, frame: 350 } // Interface final
    ];

    // Desenhar fundo
    const drawBackground = () => {
      // Fundo principal
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid cibernético
      ctx.strokeStyle = `rgba(69, 183, 209, ${0.05 + Math.sin(frame/30) * 0.03})`;
      ctx.lineWidth = 1;
      
      // Linhas horizontais
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Linhas verticais
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Efeito de brilho cibernético
      for (let i = 0; i < 5; i++) {
        const x = Math.sin((frame + i * 50) / 50) * 150 + canvas.width / 2;
        const y = Math.cos((frame + i * 50) / 70) * 100 + canvas.height / 2;
        const radius = 20 + Math.sin(frame / 20 + i) * 5;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(30, 49, 99, 0.1)');
        gradient.addColorStop(1, 'rgba(30, 49, 99, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    
    // Desenhar robô
    const drawRobot = () => {
      // Corpo
      ctx.fillStyle = colors.robotBody;
      ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
      
      // Destaque no corpo
      ctx.fillStyle = colors.robotHighlight;
      ctx.fillRect(robot.x + 3, robot.y + 3, 4, robot.height - 8);
      
      // Cabeça
      ctx.fillStyle = colors.robotHead;
      ctx.fillRect(robot.x + 2, robot.y - 12, robot.width - 4, 12);
      
      // Olhos
      ctx.fillStyle = colors.robotEye;
      ctx.fillRect(robot.x + 5, robot.y - 8, 3, 3);
      ctx.fillRect(robot.x + 12, robot.y - 8, 3, 3);
      
      // Pernas
      ctx.fillStyle = colors.robotArm;
      ctx.fillRect(robot.x + 3, robot.y + robot.height, 4, 6);
      ctx.fillRect(robot.x + robot.width - 7, robot.y + robot.height, 4, 6);
      
      // Animação de movimento das pernas
      const legAnim = Math.floor(frame / 15) % 2;
      if (legAnim === 0) {
        ctx.fillRect(robot.x + 3, robot.y + robot.height + 6, 4, 2);
        ctx.fillRect(robot.x + robot.width - 7, robot.y + robot.height + 5, 4, 2);
      } else {
        ctx.fillRect(robot.x + 3, robot.y + robot.height + 5, 4, 2);
        ctx.fillRect(robot.x + robot.width - 7, robot.y + robot.height + 6, 4, 2);
      }
      
      // Movimento do braço
      if (robot.armX !== robot.armTargetX || robot.armY !== robot.armTargetY) {
        const dx = robot.armTargetX - robot.armX;
        const dy = robot.armTargetY - robot.armY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 2) {
          robot.armX += dx / dist * 2;
          robot.armY += dy / dist * 2;
        } else {
          robot.armX = robot.armTargetX;
          robot.armY = robot.armTargetY;
          
          // Se chegou ao alvo e está segurando uma peça, coloque-a
          if (robot.holding && robot.currentPart >= 0) {
            desktopParts[robot.currentPart].placed = true;
            robot.holding = false;
            robot.currentPart = -1;
            
            // Voltar para a posição inicial
            robot.armTargetX = robot.x + robot.width - 2;
            robot.armTargetY = robot.y + 5;
          }
        }
      }
      
      // Braço
      ctx.strokeStyle = colors.robotArm;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(robot.x + robot.width - 2, robot.y + 5);
      ctx.lineTo(robot.armX, robot.armY);
      ctx.stroke();
      
      // Mão do robô
      ctx.fillStyle = colors.robotArm;
      ctx.fillRect(robot.armX - 3, robot.armY - 3, 6, 6);
      
      // Desenhar parte sendo carregada
      if (robot.holding && robot.currentPart >= 0) {
        const part = desktopParts[robot.currentPart];
        
        ctx.fillStyle = part.color;
        ctx.fillRect(
          robot.armX - part.width / 2,
          robot.armY - part.height / 2,
          part.width,
          part.height
        );
      }
    };
    
    // Desenhar desktop
    const drawDesktop = () => {
      // Desenhar partes colocadas
      desktopParts.forEach((part, index) => {
        if (part.placed) {
          ctx.fillStyle = part.color;
          
          // Moldura tem tratamento especial
          if (index === 1) {
            ctx.strokeStyle = part.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(part.x, part.y, part.width, part.height);
            
            // Cantos da moldura
            ctx.fillRect(part.x - 2, part.y - 2, 8, 8);
            ctx.fillRect(part.x + part.width - 6, part.y - 2, 8, 8);
            ctx.fillRect(part.x - 2, part.y + part.height - 6, 8, 8);
            ctx.fillRect(part.x + part.width - 6, part.y + part.height - 6, 8, 8);
          } 
          // Tratamento especial para a interface final
          else if (index === 6) {
            ctx.fillStyle = part.color;
            ctx.fillRect(part.x, part.y, part.width, part.height);
            
            // Texto de status
            ctx.font = '10px monospace';
            ctx.fillStyle = '#7BBDD4';
            ctx.fillText('STATUS: ONLINE', part.x + 5, part.y + 14);
          }
          // Ícones com brilho
          else if (index >= 2 && index <= 4) {
            ctx.fillRect(part.x, part.y, part.width, part.height);
            
            // Brilho no ícone
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(part.x + 2, part.y + 2, 3, 3);
          }
          else {
            ctx.fillRect(part.x, part.y, part.width, part.height);
          }
        }
      });
    };
    
    // Atualizar estado da animação
    const update = () => {
      frame++;
      
      // Verificar próxima parte para pegar
      if (!robot.holding && robot.currentPart === -1) {
        for (let i = 0; i < desktopParts.length; i++) {
          if (!desktopParts[i].placed && frame >= desktopParts[i].frame) {
            robot.currentPart = i;
            const part = desktopParts[i];
            
            // Primeiro vá até a "peça"
            robot.armTargetX = part.x / 2;
            robot.armTargetY = part.y / 2;
            break;
          }
        }
      }
      
      // Se o braço chegou na "peça", segure-a
      if (robot.currentPart >= 0 && !robot.holding && 
          robot.armX === robot.armTargetX && robot.armY === robot.armTargetY) {
        robot.holding = true;
        
        // Agora mova para a posição final
        const part = desktopParts[robot.currentPart];
        robot.armTargetX = part.x + part.width / 2;
        robot.armTargetY = part.y + part.height / 2;
      }
      
      // Reiniciar a animação quando todas as partes forem colocadas
      if (desktopParts.every(part => part.placed) && 
          frame > desktopParts[desktopParts.length - 1].frame + 150) {
        frame = 0;
        desktopParts.forEach(part => {
          part.placed = false;
        });
        
        robot.armX = robot.x + robot.width - 2;
        robot.armY = robot.y + 5;
        robot.armTargetX = robot.x + robot.width - 2;
        robot.armTargetY = robot.y + 5;
        robot.holding = false;
        robot.currentPart = -1;
      }
    };
    
    // Loop principal da animação
    const animate = () => {
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Atualizar estado
      update();
      
      // Renderizar cena
      drawBackground();
      drawDesktop();
      drawRobot();
      
      // Continuar o loop
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Iniciar animação
    animate();
    
    // Limpar quando o componente for desmontado
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Estamos montando algo incrível!
          </h1>
          <p className="text-gray-300 mb-8">
            Nos bastidores, os blocos estão se encaixando. Volte em breve!
          </p>
          
          <div className="flex justify-center mb-8">
            <div className="relative bg-gray-900 rounded-lg p-2 shadow-inner">
              <canvas 
                ref={canvasRef} 
                style={{ 
                  width: '100%', 
                  maxWidth: '640px', 
                  height: 'auto', 
                  aspectRatio: '4/3',
                  imageRendering: 'pixelated' 
                }}
              />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="inline-block bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-300 animate-pulse">
                  Construindo seu acesso ao futuro... Aguarde só um instante.
                </div>
              </div>
            </div>
          </div>
          
          <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 text-white font-medium py-2 px-6 rounded-md transition-all transform hover:scale-105 shadow-md hover:shadow-lg">
            <FaHome className="mr-1" /> Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnderConstructionPage; 