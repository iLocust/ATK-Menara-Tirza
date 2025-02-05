import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

const ShoppingCart = ({ 
  cart, 
  cartErrors, 
  onUpdateQuantity, 
  onCheckout 
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // State untuk menyimpan nilai input sementara
  const [inputValues, setInputValues] = useState({});

  const handleQuantityChange = (itemId, value) => {
    // Update nilai input di state lokal
    setInputValues(prev => ({
      ...prev,
      [itemId]: value
    }));

    // Jika input kosong, biarkan dulu
    if (value === '') return;

    const numValue = parseInt(value, 10);
    // Hanya update ke parent jika nilai valid
    if (!isNaN(numValue) && numValue >= 0) {
      const item = cart.find(item => item.id === itemId);
      if (item && numValue <= item.stock) {
        onUpdateQuantity(itemId, numValue);
      }
    }
  };

  const handleBlur = (itemId) => {
    // Saat input kehilangan fokus, kembalikan ke nilai quantity yang valid
    const item = cart.find(item => item.id === itemId);
    setInputValues(prev => ({
      ...prev,
      [itemId]: item.quantity.toString()
    }));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle>Keranjang Belanja</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4 pt-2">
          {cart.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-green-600">
                    Rp {item.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Subtotal: Rp {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={inputValues[item.id] ?? item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    onBlur={() => handleBlur(item.id)}
                    className="w-16 text-center h-8"
                    min="0"
                    max={item.stock}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </Button>
                </div>
              </div>
              {cartErrors[item.id] && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {cartErrors[item.id]}
                </div>
              )}
            </div>
          ))}

          {cart.length > 0 ? (
            <div className="space-y-4 sticky bottom-0 bg-white pt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-green-600">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                size="lg"
                onClick={onCheckout}
              >
                Bayar Sekarang ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
              </Button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-center text-gray-500">Keranjang kosong</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShoppingCart;