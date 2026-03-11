
import React, { useState } from 'react';
import { Zap, User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (mode: 'visitor' | 'admin') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (username === 'Loop' && password === '1234') {
        onLogin('admin');
      } else {
        setError('Credenciais inválidas. Tente novamente.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="h-screen w-full bg-brand-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-800 rounded-full blur-[100px] -mr-64 -mt-64 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-500 rounded-full blur-[120px] -ml-48 -mb-48 opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-brand-800/20">
          
          <div className="bg-brand-600 p-10 text-center flex flex-col items-center">
            <div className="bg-white p-4 rounded-3xl shadow-xl mb-6 scale-110">
              <Zap className="text-brand-600" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              LOOP <span className="text-gold-400">ENERGIA</span>
            </h1>
            <p className="text-[10px] text-brand-200 uppercase tracking-[0.3em] font-bold mt-2">Gestão de Experiência do Cliente</p>
          </div>

          <div className="p-10">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-brand-900 tracking-widest mb-2 block">Usuário</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full pl-12 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white focus:border-brand-500 transition text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-brand-900 tracking-widest mb-2 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-300" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white focus:border-brand-500 transition text-sm font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-300 hover:text-brand-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-bounce">{error}</p>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-700 shadow-xl hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Acessar Painel <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-gray-300">
                <span className="bg-white px-4">Ou se preferir</span>
              </div>
            </div>

            <button 
              onClick={() => onLogin('visitor')}
              className="w-full bg-gray-50 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              Entrar como Visitante
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest opacity-60">© 2024 Loop Energia • Sistema de Gestão GEV</p>
        </div>
      </div>
    </div>
  );
};
