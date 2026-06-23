import { useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  HelpCircle,
  Calendar,
  Info,
  BarChart3,
  Settings,
  Home
} from "lucide-react";
import { Button } from './ui/button'

interface HeaderProps {
  title: string
  onHelp: () => void
  onStats: () => void
  onSettings: () => void
  onAbout: () => void
  onArchive: () => void
  onToggleTabs: () => void
  isArchive: boolean
  archiveDayNumber?: number
}

export function Header({
  title,
  onHelp,
  onStats,
  onSettings,
  onAbout,
  onArchive,
  onToggleTabs,
  isArchive,
  archiveDayNumber
}: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleBackToToday = () => {
    // Remover query param e voltar para o dia atual
    const path = location.pathname
    navigate(path)
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm flex-shrink-0 z-10">
      <div className="max-w-7xl mx-auto px-2 py-2 sm:px-4 sm:py-3 flex md:grid md:grid-cols-3 items-center justify-between">
        {/* Left section: Toggle + Logo (mobile) / Toggle + Buttons (desktop) */}
        <div className="flex items-center gap-1 sm:gap-2 md:justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTabs}
            aria-label="Alternar modos de jogo"
            className="text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Logo on mobile */}
          <h1 className="text-white text-base sm:text-lg md:hidden uppercase tracking-wider font-bold">
            {title}
          </h1>

          {/* Help button (visible on all screens) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelp}
            aria-label="Ajuda"
            className="text-slate-300 hover:text-white"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Center logo (desktop only) */}
        <div className="hidden md:flex items-center justify-center flex-col gap-1">
          <h1 className="text-white text-lg md:text-xl lg:text-2xl uppercase tracking-wider font-bold">
            {title}
          </h1>
          {isArchive && archiveDayNumber && (
            <div className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              🕰️ Arquivo - Dia #{archiveDayNumber}
            </div>
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1 sm:gap-2 md:justify-end">
          {isArchive ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToToday}
              aria-label="Voltar para Hoje"
              className="text-green-400 hover:text-green-300 hidden md:flex"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onArchive}
              aria-label="Arquivo de Dias Anteriores"
              className="text-slate-300 hover:text-white"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onAbout}
            aria-label="Sobre"
            className="text-slate-300 hover:text-white"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onStats}
            aria-label="Estatísticas"
            className="text-slate-300 hover:text-white"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            aria-label="Configurações"
            className="text-slate-300 hover:text-white"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
