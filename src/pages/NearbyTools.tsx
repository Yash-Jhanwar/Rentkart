
import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, Hammer, IndianRupee, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Tool {
  name: string;
  distance: number;
  price: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  tools: Tool[];
}

const NearbyTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [allTools, setAllTools] = useState<Tool[]>([]); // Store all tools for debug
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false); // Debug: show all tools

  // Get user location and fetch nearby tools
  const getUserLocation = () => {
    setLoading(true);
    setError(null);
    setLocationDenied(false);

    console.log('📍 [Buyer] Requesting location...');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 [Buyer] Location acquired:', { lat: latitude, lon: longitude });
        setUserLocation({ lat: latitude, lon: longitude });
        
        // Fetch both nearby and all tools for comparison
        fetchNearbyTools(latitude, longitude);
        fetchAllTools(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        console.error('📍 [Buyer] Geolocation error:', err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
          setError('Please enable location to see nearby tools');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information unavailable');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out');
        } else {
          setError('An error occurred while getting your location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fetch nearby tools from backend API (with 3.2km radius)
  const fetchNearbyTools = async (lat: number, lon: number) => {
    try {
      console.log('🔍 [Buyer] Fetching nearby tools at:', { lat, lon });
      const response = await fetch(
        `http://localhost:5000/nearby-tools?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('🔍 [Buyer] Nearby tools response:', data);

      if (data.success) {
        setTools(data.tools);
        console.log(`✅ [Buyer] Found ${data.tools.length} tools within 3.2km`);
        
        // Log each tool for debugging
        data.tools.forEach((tool, i) => {
          console.log(`   ${i + 1}. ${tool.name} - ${tool.distance.toFixed(2)}km`);
        });
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      console.error('❌ [Buyer] API error:', err);
    }
  };

  // Fetch ALL tools for debug comparison (no radius filter)
  const fetchAllTools = async (userLat: number, userLon: number) => {
    try {
      console.log('🔍 [Debug] Fetching ALL tools for comparison...');
      const response = await fetch('http://localhost:5000/tools');
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success && data.tools) {
        // Calculate distance for each tool
        const toolsWithDistance = data.tools.map((tool: any) => {
          const distance = calculateDistance(userLat, userLon, tool.lat, tool.lon);
          return {
            name: tool.name,
            distance: distance,
            price: tool.price
          };
        }).sort((a: Tool, b: Tool) => a.distance - b.distance);
        
        setAllTools(toolsWithDistance);
        console.log('🔍 [Debug] All tools in database:', toolsWithDistance.length);
        toolsWithDistance.forEach((tool: Tool, i: number) => {
          const withinRange = tool.distance <= 3.2 ? '✅' : '❌';
          console.log(`   ${withinRange} ${tool.name} - ${tool.distance.toFixed(2)}km`);
        });
      }
    } catch (err) {
      console.error('Debug fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simple distance calculation for debug display
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
  };

  // Request location permission again
  const retryLocation = () => {
    getUserLocation();
  };

  // Fetch location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tools Near You
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Find rental tools within 3.2 km radius
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Debug Mode Toggle */}
              <Button
                onClick={() => setDebugMode(!debugMode)}
                variant={debugMode ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
                title="Toggle debug mode to see all tools regardless of distance"
              >
                {debugMode ? '🐛 Debug ON' : '🐛 Debug OFF'}
              </Button>
              <Button
                onClick={retryLocation}
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {loading ? 'Updating...' : 'Update Location'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Detecting your location...
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Please allow location access when prompted
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert 
            variant={locationDenied ? "destructive" : "default"}
            className="mb-6 max-w-2xl mx-auto"
          >
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="flex flex-col gap-3">
              <span className="font-medium">{error}</span>
              {locationDenied && (
                <div className="text-sm space-y-2">
                  <p>To enable location:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Click the location icon in your browser's address bar</li>
                    <li>Select "Allow" for this site</li>
                    <li>Refresh the page and try again</li>
                  </ul>
                  <Button 
                    onClick={retryLocation} 
                    variant="outline" 
                    size="sm"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* User Location Info */}
        {userLocation && !loading && !error && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Navigation className="h-4 w-4" />
                <span>
                  Your location:{' '}
                  <span className="font-mono font-medium bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">
                    [{userLocation.lat.toFixed(6)}, {userLocation.lon.toFixed(6)}]
                  </span>
                </span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Search radius: {debugMode ? '∞ (unlimited)' : '3.2 km'}
              </span>
            </div>
          </div>
        )}

        {/* Debug Mode Notice */}
        {debugMode && !loading && !error && (
          <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Debug Mode Active:</strong> Showing all {allTools.length} tools in database (not filtered by distance).
              Toggle off to see only tools within 3.2km.
            </AlertDescription>
          </Alert>
        )}

        {/* Tools Grid - Show nearby OR all tools in debug mode */}
        {!loading && !error && (debugMode ? allTools : tools).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Found {(debugMode ? allTools : tools).length} tool{(debugMode ? allTools : tools).length !== 1 ? 's' : ''}
                {debugMode ? ' in database' : ' nearby'}
              </h2>
              <Badge variant="secondary" className="text-xs">
                Sorted by distance
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(debugMode ? allTools : tools).map((tool, index) => (
                <Card 
                  key={index} 
                  className={`hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800 dark:border-gray-700 ${
                    tool.distance > 3.2 ? 'opacity-75 border-dashed' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Hammer className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {index === 0 && !debugMode && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Nearest
                          </Badge>
                        )}
                        {debugMode && (
                          <Badge 
                            variant={tool.distance <= 3.2 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {tool.distance <= 3.2 ? '✅ Within 3.2km' : `❌ ${tool.distance.toFixed(1)}km`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">
                      {tool.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{tool.distance.toFixed(2)} km away</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        <span>{tool.price}/day</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      size="sm"
                      disabled={tool.distance > 3.2 && !debugMode}
                    >
                      {tool.distance > 3.2 && !debugMode ? 'Too far away' : 'Rent Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Tools Found */}
        {!loading && !error && (debugMode ? allTools : tools).length === 0 && userLocation && (
          <div className="text-center py-20">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mb-4">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {debugMode ? 'No tools in database' : 'No tools found nearby'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              {debugMode 
                ? 'The database appears to be empty. Try listing a tool first.' 
                : `We couldn't find any tools within 3.2 km of your location [${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}].
                  Try enabling debug mode to see all tools, or check the console for details.`}
            </p>
            {!debugMode && allTools.length > 0 && (
              <p className="text-sm text-muted-foreground">
                ({allTools.length} tools exist but are outside 3.2km radius)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyTools;
