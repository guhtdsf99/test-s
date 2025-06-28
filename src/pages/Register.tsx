
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, User, Phone, Lock, LogIn } from 'lucide-react';

const Register = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "يرجى التأكد من تطابق كلمتي المرور",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call to register account
    setTimeout(() => {
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول إلى حسابك",
      });
      
      // In a real application, you would redirect to login page or dashboard
      window.location.href = '/login';
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/876a553e-d478-4016-a8f0-1580f492ca19.png" 
            alt="CSWORD Logo" 
            className="h-12 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold">إنشاء حساب جديد</h1>
          <p className="text-gray-500 mt-2">أنشئ حسابك للبدء في استخدام النظام</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>إنشاء حساب</CardTitle>
            <CardDescription>أدخل معلومات شركتك وبياناتك الشخصية</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">اسم الشركة</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="companyName" 
                    name="companyName"
                    placeholder="أدخل اسم الشركة" 
                    className="pl-10" 
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminName">اسم المسؤول</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="adminName" 
                    name="adminName"
                    placeholder="أدخل اسمك الكامل" 
                    className="pl-10" 
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="example@company.com" 
                      className="pl-10" 
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="phone" 
                      name="phone"
                      type="tel" 
                      placeholder="+966 5X XXX XXXX" 
                      className="pl-10" 
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10" 
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#907527] hover:bg-[#705b1e]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التسجيل...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    إنشاء الحساب
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-[#907527] hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
