/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  CubeIcon,
  ArrowDownOnSquareIcon,
  ShoppingCartIcon,
  WalletIcon,
  DocumentTextIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDummyData } from '@/lib/db/dummy';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon }, 
  { name: 'Produk', href: '/produk', icon: CubeIcon },
  { name: 'Penjualan', href: '/penjualan', icon: ShoppingCartIcon },
  { name: 'Riwayat Transaksi', href: '/riwayat-transaksi', icon: CubeIcon },
  { name: 'Stok Masuk', href: '/inventori/stok-masuk', icon: ArrowDownOnSquareIcon },
  { name: 'Kas Koperasi', href: '/kas', icon: WalletIcon },
  { name: 'Laporan Penjualan', href: '/report', icon: DocumentTextIcon }
];

const MenuItem = ({ item, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.submenu) {
    return (
      <div className="mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
        >
          <div className="flex items-center">
            <item.icon className="mr-3 h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {isOpen && (
          <div className="ml-8 space-y-2 mt-2">
            {item.submenu.map((subitem) => (
              <Link
                key={subitem.name}
                to={subitem.href}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                onClick={onClick}
              >
                <subitem.icon className="mr-3 h-4 w-4" />
                {subitem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className="flex items-center px-4 py-3 mb-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
      onClick={onClick}
    >
      <item.icon className="mr-4 h-8 w-8" />
      <span className="font-medium">{item.name}</span>
    </Link>
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDummyData = async () => {
    try {
      setIsLoading(true);
      const result = await addDummyData();
      setMessage({ type: 'success', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menambahkan data dummy: ' + err.message });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <img src="/ama.avif" alt="Koperasi ATK" className="h-24 mx-auto mb-4 pt-3" />
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 px-6">MENARA TIRZA CHRISTIAN SCHOOL</h2>
          <p className="text-md text-gray-500">Sistem Manajemen Koperasi</p>
        </div>
      </div>
      
      <nav className="bg-white text-hflex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <MenuItem key={item.name} item={item} onClick={() => setIsOpen && setIsOpen(false)} />
        ))}
      </nav>

      {/* <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
          onClick={handleAddDummyData}
          disabled={isLoading}
        >
          <DatabaseIcon className="h-4 w-4" />
          {isLoading ? 'Loading...' : 'Import Data Dummy'}
        </Button>
      </div> */}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Mobile Sidebar Panel */}
        <div 
          className={`fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            onClick={() => setIsOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-72 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="fixed bottom-4 right-4 w-96 z-50">
          <Alert 
            variant={message.type === 'error' ? "destructive" : "default"}
            className={`
              ${message.type === 'success' ? "bg-green-50 text-green-700 border-green-200" : ""}
              shadow-lg transform transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-2
            `}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default Sidebar;