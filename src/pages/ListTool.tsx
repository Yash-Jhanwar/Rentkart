import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/mockData";
import { Upload, ImagePlus, FileText, Lock, AlertCircle, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

interface FormErrors {
  toolName?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  pricePerDay?: string;
  deposit?: string;
  location?: string;
  images?: string;
  availability?: string;
}

const ListTool = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useUser();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    toolName: "",
    description: "",
    category: "",
    subcategory: "",
    pricePerDay: "",
    deposit: "",
    location: currentUser?.location || "",
    usageGuide: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get coordinates from browser geolocation - NO FALLBACK
  const getCoordinates = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          console.log('📍 Seller location acquired:', coords);
          resolve(coords);
        },
        (error) => {
          console.error('📍 Geolocation error:', error.code, error.message);
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Please enable location to list your tool'));
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            reject(new Error('Location information unavailable'));
          } else if (error.code === error.TIMEOUT) {
            reject(new Error('Location request timed out'));
          } else {
            reject(new Error('Failed to get your location'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/signup");
    }
  }, [currentUser, isLoading, navigate]);

  // Access control checks
  if (!isLoading && currentUser?.mode !== "seller") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Seller Mode Required</h1>
            <p className="text-muted-foreground mb-6">
              Switch to Seller Mode to list tools.
            </p>
            <Button onClick={() => navigate("/profile")}>
              Go to Profile
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isLoading && !currentUser?.isSeller) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Seller Registration Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to complete seller registration (KYC) before listing tools.
            </p>
            <Button onClick={() => navigate("/seller-registration")}>
              Complete Seller Registration
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const subcategories = categories.find(c => c.name === selectedCategory)?.subcategories || [];

  // Form validation
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.toolName.trim()) {
      newErrors.toolName = "Tool name is required";
    } else if (formData.toolName.length < 3) {
      newErrors.toolName = "Tool name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!selectedCategory) {
      newErrors.category = "Category is required";
    }

    if (!formData.subcategory) {
      newErrors.subcategory = "Subcategory is required";
    }

    if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = "Price must be greater than 0";
    }

    if (formData.deposit === "" || Number(formData.deposit) < 0) {
      newErrors.deposit = "Deposit must be 0 or greater";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (unavailableDates.length > 0 && unavailableDates.length >= 365) {
      newErrors.availability = "Please set some available dates";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: ""
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subcategory: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            if (newImages.length === Math.min(files.length, 5)) {
              setImages(prev => [...prev, ...newImages].slice(0, 5));
            }
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleUnavailableDate = (dateString: string) => {
    setUnavailableDates(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ title: "Error", description: "Please fix the errors in the form" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get coordinates from browser - NO FALLBACK
      console.log('📍 Requesting seller location...');
      const { lat, lon } = await getCoordinates();
      console.log('📍 Will save tool at location:', { lat, lon });

      // Prepare request body
      const requestBody = {
        name: formData.toolName,
        description: formData.description,
        price: Number(formData.pricePerDay),
        deposit: Number(formData.deposit) || 0,
        lat: lat,
        lon: lon,
        sellerId: currentUser?.id || 'demo-user',
        category: selectedCategory,
        subcategory: formData.subcategory,
        usageGuide: formData.usageGuide
      };

      console.log('📤 Sending to API:', requestBody);

      // Call backend API
      const response = await fetch('http://localhost:5000/add-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📥 API response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to list tool');
      }

      console.log('✅ Tool saved with location:', data.tool?.location);

      // Success - show alert and reset form
      toast({
        title: "Success",
        description: `Tool listed successfully at [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
      });

      // Reset form
      setFormData({
        toolName: "",
        description: "",
        category: "",
        subcategory: "",
        pricePerDay: "",
        deposit: "",
        location: currentUser?.location || "",
        usageGuide: "",
      });
      setSelectedCategory("");
      setImages([]);
      setUnavailableDates([]);

      // Redirect after delay
      setTimeout(() => {
        navigate("/my-listings");
      }, 1500);

    } catch (error) {
      console.error('❌ Error listing tool:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to list tool. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="container mx-auto flex-1 px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">List a Tool</h1>
        <p className="text-muted-foreground mb-8">Share your tools with neighbors and earn money. Fill in all the details below.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Tool Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1">
              Tool Name
              <span className="text-red-500">*</span>
            </label>
            <Input
              name="toolName"
              placeholder="e.g. Bosch Impact Drill"
              value={formData.toolName}
              onChange={handleInputChange}
              className={errors.toolName ? "border-red-500" : ""}
            />
            {errors.toolName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.toolName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formData.toolName.length}/50 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1">
              Description
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              name="description"
              placeholder="Describe the tool, condition, brand, what's included (e.g., accessories, manuals), etc..."
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
          </div>

          {/* Category & Subcategory */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                Category
                <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCategory}
                onChange={e => handleCategoryChange(e.target.value)}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${errors.category ? "border-red-500" : ""}`}
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                Subcategory
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.subcategory}
                onChange={e => handleSubcategoryChange(e.target.value)}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${errors.subcategory ? "border-red-500" : ""}`}
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory</option>
                {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subcategory && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.subcategory}
                </p>
              )}
            </div>
          </div>

          {/* Price & Deposit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                Price per Day (₹)
                <span className="text-red-500">*</span>
              </label>
              <Input
                name="pricePerDay"
                type="number"
                placeholder="150"
                min="1"
                value={formData.pricePerDay}
                onChange={handleInputChange}
                className={errors.pricePerDay ? "border-red-500" : ""}
              />
              {selectedCategory && (
                <p className="text-xs text-muted-foreground rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2 border border-blue-200/50 dark:border-blue-800/30">
                  💡 Similar {selectedCategory} tools average ₹200-400/day. Adjust based on condition and features.
                </p>
              )}
              {errors.pricePerDay && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.pricePerDay}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1">
                Security Deposit (₹)
                <span className="text-red-500">*</span>
              </label>
              <Input
                name="deposit"
                type="number"
                placeholder="500"
                min="0"
                value={formData.deposit}
                onChange={handleInputChange}
                className={errors.deposit ? "border-red-500" : ""}
              />
              {errors.deposit && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.deposit}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1">
              Pickup Location
              <span className="text-red-500">*</span>
            </label>
            <Input
              name="location"
              placeholder="e.g. Koramangala, Bangalore"
              value={formData.location}
              onChange={handleInputChange}
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.location}
              </p>
            )}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-1">
              Tool Images
              <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground font-normal">({images.length}/5)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 transition-colors hover:border-primary/30 hover:bg-primary/5">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 text-xs text-muted-foreground text-center px-2">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            {errors.images && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.images}
              </p>
            )}
          </div>

          {/* Availability Calendar */}
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Availability Calendar</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {showCalendar ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click on dates to mark them as unavailable. Leave some dates available for rentals.
            </p>

            {showCalendar && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-semibold">
                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar().map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateString = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isUnavailable = unavailableDates.includes(dateString);

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleUnavailableDate(dateString)}
                        className={`aspect-square rounded text-xs font-medium transition-colors ${
                          isUnavailable
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-muted text-foreground hover:bg-primary/20"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Unavailable dates: <span className="font-medium">{unavailableDates.length}</span>
                </p>
              </div>
            )}
          </div>

          {/* Usage Guide Section */}
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <label className="text-sm font-semibold">Usage Guide / Instructions</label>
            </div>
            <p className="text-xs text-muted-foreground">Help borrowers use your tool safely with step-by-step instructions.</p>

            <Textarea
              name="usageGuide"
              placeholder={`e.g.\n1. Insert the correct drill bit for your material\n2. Set the torque level - use high for concrete\n3. Hold the drill firmly with both hands\n4. Start at slow speed, then increase gradually\n5. Wear safety goggles and ear protection`}
              rows={5}
              value={formData.usageGuide}
              onChange={handleInputChange}
            />
          </div>

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Listing Tool...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> List Tool
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By listing a tool, you agree to our Terms of Service and are responsible for its condition and safety.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default ListTool;
