import { Link } from 'react-router-dom';
import { useState } from 'react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  CubeIcon,
  ArrowDownOnSquareIcon,
  ShoppingCartIcon,
  WalletIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { DatabaseIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addDummyData } from '@/lib/db/dummy';

const navigation = [
  { name: 'Produk', href: '/produk', icon: CubeIcon },
  { name: 'Penjualan', href: '/penjualan', icon: ShoppingCartIcon },
  { name: 'Riwayat Transaksi', href: '/riwayat-transaksi', icon: CubeIcon },
  { name: 'Stok Masuk', href: '/inventori/stok-masuk', icon: ArrowDownOnSquareIcon },
  { name: 'Kas Koperasi', href: '/kas', icon: WalletIcon },
  // { name: 'Ringkasan Bulanan', href: '/summary', icon: ChartBarIcon },
  // { name: 'Laporan Penjualan', href: '/report', icon: DocumentTextIcon }
];

const MenuItem = ({ item, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.submenu) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-2 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
        >
          <div className="flex items-center">
            <item.icon className="mr-4 h-6 w-6" />
            {item.name}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {isOpen && (
          <div className="ml-8 space-y-1 mt-1">
            {item.submenu.map((subitem) => (
              <Link
                key={subitem.name}
                to={subitem.href}
                className="flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                onClick={onClick}
              >
                <subitem.icon className="mr-3 h-5 w-5" />
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
      className="flex items-center px-2 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
      onClick={onClick}
    >
      <item.icon className="mr-4 h-6 w-6" />
      {item.name}
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
    <>
      <div className="flex h-16 items-center px-4">
        <span className="text-xl font-semibold">Koperasi ATK</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <MenuItem key={item.name} item={item} onClick={() => setIsOpen && setIsOpen(false)} />
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleAddDummyData}
          disabled={isLoading}
        >
          <DatabaseIcon className="h-4 w-4" />
          {isLoading ? 'Loading...' : 'Import Data Dummy'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          onClick={() => setIsOpen(false)}
        />
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-semibold">Koperasi ATK</span>
            <button
              type="button"
              className="text-gray-500"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
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
            className={message.type === 'success' ? "bg-green-50 text-green-700 border-green-200" : ""}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default Sidebar;