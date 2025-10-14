import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import DynamicText from './DynamicText';

interface PDFViewerProps {
  uri: string;
  name: string;
  onClose: () => void;
  theme?: any;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ uri, name, onClose, theme }) => {
  // Default theme if not provided
  const defaultTheme = {
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#3B82F6',
    border: '#333333',
    statusBarStyle: 'light-content' as const,
  };
  
  const currentTheme = theme || defaultTheme;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);

  // Convert PDF to data URI for PDF.js
  useEffect(() => {
    const preparePdfForWebView = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (uri.startsWith('file://')) {
          // Read the PDF file as base64 for PDF.js
          console.log('Converting PDF to data URI for PDF.js...');
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          console.log('Base64 length:', base64.length);
          
          // Create data URI for PDF.js
          const dataUri = `data:application/pdf;base64,${base64}`;
          console.log('Data URI created for PDF.js, length:', dataUri.length);
          setPdfDataUri(dataUri);
        } else {
          // For web URLs, use directly
          console.log('Using web URL directly:', uri);
          setPdfDataUri(uri);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to prepare PDF for WebView:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    preparePdfForWebView();
  }, [uri]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: currentTheme.background,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    logoContainer: {
      width: 40,
      height: 40,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 30,
      height: 30,
    },
    headerText: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.accent + '20',
    },
    pdfContainer: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    pdf: {
      flex: 1,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height - 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: currentTheme.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  const handleLoadEnd = () => {
    console.log('WebView load ended successfully');
    setLoading(false);
    setError(null);
  };

  const handleError = (error: any) => {
    console.error('PDF WebView Error:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const handleLoadStart = () => {
    console.log('WebView started loading PDF data URI');
  };

  const handleLoadProgress = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView loading progress:', nativeEvent.progress);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
  };

  // Create HTML content for PDF viewer using PDF.js
  const createPdfViewerHtml = (pdfUri: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #1a1a1a;
            overflow: hidden;
            font-family: Arial, sans-serif;
          }
          #pdf-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: #2a2a2a;
            color: white;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            flex-shrink: 0;
          }
          #pdf-viewer {
            flex: 1;
            background: white;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
          }
          .error {
            color: #ff6b6b;
            text-align: center;
            padding: 20px;
            background: #1a1a1a;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          .loading {
            color: white;
            text-align: center;
            padding: 20px;
            background: #1a1a1a;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          canvas {
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <div id="pdf-container">
          <div class="header">PDF Viewer - ${name}</div>
          <div id="pdf-viewer">
            <div class="loading">Loading PDF...</div>
          </div>
        </div>
        <script>
          console.log('PDF Viewer HTML loaded');
          console.log('PDF URI:', '${pdfUri}');
          console.log('PDF URI type:', typeof '${pdfUri}');
          console.log('PDF URI length:', '${pdfUri}'.length);
          
          // Configure PDF.js
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          // Load PDF with better error handling
          const loadingTask = pdfjsLib.getDocument({
            url: '${pdfUri}',
            verbosity: 1 // Enable debug logging
          });
          
          loadingTask.promise.then(function(pdf) {
            console.log('PDF loaded successfully, pages:', pdf.numPages);
            
            const container = document.getElementById('pdf-viewer');
            container.innerHTML = '';
            
            // Render all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              pdf.getPage(pageNum).then(function(page) {
                console.log('Rendering page', pageNum);
                const scale = 1.5;
                const viewport = page.getViewport({scale: scale});
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                
                page.render(renderContext).promise.then(function() {
                  console.log('Page ' + pageNum + ' rendered successfully');
                }).catch(function(renderError) {
                  console.error('Page ' + pageNum + ' render error:', renderError);
                });
                
                container.appendChild(canvas);
              }).catch(function(pageError) {
                console.error('Page ' + pageNum + ' load error:', pageError);
              });
            }
          }).catch(function(error) {
            console.error('PDF loading error:', error);
            console.error('Error details:', error.message, error.stack);
            document.getElementById('pdf-viewer').innerHTML = '<div class="error">Failed to load PDF: ' + error.message + '</div>';
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle={currentTheme.statusBarStyle} />
      
      {/* Header with Logo */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.logoContainer}>
          <Image 
            source={require('../../assets/sign in logo.png')} 
            style={dynamicStyles.logo}
            resizeMode="contain"
          />
        </View>
        <DynamicText type="card" style={dynamicStyles.headerText} numberOfLines={1}>
          {name}
        </DynamicText>
        <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
          <DynamicText type="card" style={{ fontSize: 20, color: currentTheme.text }}>
            ✕
          </DynamicText>
        </TouchableOpacity>
      </View>

      {/* PDF Content */}
      <View style={dynamicStyles.pdfContainer}>
        {loading && (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.accent} />
            <DynamicText type="card" style={{ marginTop: 10, color: currentTheme.text }}>
              Loading PDF...
            </DynamicText>
          </View>
        )}

        {error ? (
          <View style={dynamicStyles.errorContainer}>
            <DynamicText type="card" style={dynamicStyles.errorText}>
              {error}
            </DynamicText>
            <TouchableOpacity style={dynamicStyles.retryButton} onPress={handleRetry}>
              <DynamicText type="card" style={dynamicStyles.retryButtonText}>
                Retry
              </DynamicText>
            </TouchableOpacity>
          </View>
        ) : pdfDataUri ? (
          <WebView
            source={{ html: createPdfViewerHtml(pdfDataUri) }}
            style={dynamicStyles.pdf}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onLoadProgress={handleLoadProgress}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            onMessage={(event) => {
              console.log('WebView message:', event.nativeEvent.data);
            }}
          />
        ) : (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.accent} />
            <DynamicText type="card" style={{ marginTop: 10, color: currentTheme.text }}>
              Preparing PDF...
            </DynamicText>
          </View>
        )}
      </View>

    </View>
  );
};

export default PDFViewer;
