import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
            <Globe className="w-3 h-3 text-gray-500" />
            <span className={language === 'ja' ? 'font-bold text-blue-600' : 'text-gray-400'}>JP</span>
            <span className="text-gray-300">|</span>
            <span className={language === 'en' ? 'font-bold text-blue-600' : 'text-gray-400'}>EN</span>
        </button>
    );
};

export default LanguageToggle;
