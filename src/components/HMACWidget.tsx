import React, { useState, useCallback, useEffect } from 'react';

type HMACAlgorithm = 'HS256' | 'HS384' | 'HS512';
type EncodingType = 'hex' | 'base64';

interface VerificationResult {
  isValid: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export const HMACWidget: React.FC = () => {
  const [payload, setPayload] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<HMACAlgorithm>('HS256');
  const [encoding, setEncoding] = useState<EncodingType>('hex');
  const [generatedSignature, setGeneratedSignature] = useState<string>('');
  const [receivedSignature, setReceivedSignature] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const getAlgorithmName = useCallback((algo: HMACAlgorithm): string => {
    switch (algo) {
      case 'HS256': return 'SHA-256';
      case 'HS384': return 'SHA-384';
      case 'HS512': return 'SHA-512';
      default: return 'SHA-256';
    }
  }, []);

  const generateHMAC = useCallback(async () => {
    if (!payload.trim() || !secret.trim()) {
      setGeneratedSignature('');
      setError('');
      return;
    }

    setIsGenerating(true);
    setError('');
    setVerificationResult(null);

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(payload);

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: getAlgorithmName(algorithm) },
        false,
        ['sign']
      );

      // Sign the message
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      
      // Convert to selected encoding
      const signatureArray = new Uint8Array(signature);
      let encodedSignature: string;
      
      if (encoding === 'hex') {
        encodedSignature = Array.from(signatureArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else {
        encodedSignature = btoa(String.fromCharCode(...signatureArray));
      }
      
      setGeneratedSignature(encodedSignature);
    } catch (err) {
      setError(`Error generating HMAC: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setGeneratedSignature('');
    } finally {
      setIsGenerating(false);
    }
  }, [payload, secret, algorithm, encoding, getAlgorithmName]);

  const verifyHMAC = useCallback(async () => {
    if (!payload.trim() || !secret.trim() || !receivedSignature.trim()) {
      setVerificationResult(null);
      return;
    }

    setError('');

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(payload);

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: getAlgorithmName(algorithm) },
        false,
        ['verify']
      );

      // Convert received signature based on encoding
      let receivedSignatureBytes: Uint8Array;
      
      if (encoding === 'hex') {
        // Convert hex to bytes
        const hex = receivedSignature.replace(/[^0-9a-fA-F]/g, '');
        receivedSignatureBytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      } else {
        // Convert base64 to bytes
        receivedSignatureBytes = Uint8Array.from(atob(receivedSignature), c => c.charCodeAt(0));
      }

      // Verify the signature
      const isValid = await crypto.subtle.verify('HMAC', cryptoKey, receivedSignatureBytes, messageData);

      if (isValid) {
        setVerificationResult({
          isValid: true,
          message: '✅ Signature is valid!',
          type: 'success'
        });
      } else {
        setVerificationResult({
          isValid: false,
          message: '❌ Signature is invalid!',
          type: 'error'
        });
      }
    } catch (err) {
      setVerificationResult({
        isValid: false,
        message: `⚠️ Error during verification: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'warning'
      });
    }
  }, [payload, secret, receivedSignature, algorithm, encoding, getAlgorithmName]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  // Auto-generate signature when payload or secret changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateHMAC();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [payload, secret, algorithm, encoding, generateHMAC]);

  // Auto-verify when received signature changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      verifyHMAC();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [receivedSignature, verifyHMAC]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Payload Input */}
      <div className="form-group">
        <label htmlFor="payload">Payload</label>
        <textarea
          id="payload"
          className="form-control textarea"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Enter the payload content to sign or verify..."
        />
      </div>

      {/* Algorithm Selector */}
      <div className="form-group">
        <label>HMAC Algorithm</label>
        <div className="algorithm-selector">
          <button
            className={`algorithm-option ${algorithm === 'HS256' ? 'active' : ''}`}
            onClick={() => setAlgorithm('HS256')}
          >
            HS256 (SHA-256)
          </button>
          <button
            className={`algorithm-option ${algorithm === 'HS384' ? 'active' : ''}`}
            onClick={() => setAlgorithm('HS384')}
          >
            HS384 (SHA-384)
          </button>
          <button
            className={`algorithm-option ${algorithm === 'HS512' ? 'active' : ''}`}
            onClick={() => setAlgorithm('HS512')}
          >
            HS512 (SHA-512)
          </button>
        </div>
      </div>

      {/* Secret Input */}
      <div className="form-group">
        <label htmlFor="secret">Webhook Secret</label>
        <input
          id="secret"
          type="text"
          className="form-control"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter your webhook secret key..."
        />
      </div>

      {/* Generated Signature Display - Always shown */}
      <div className="form-group">
        <label htmlFor="generatedSignature">Generated Signature</label>
        <div className="signature-display" style={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
          {isGenerating ? (
            <span style={{ color: 'var(--text-muted)' }}>Generating signature...</span>
          ) : generatedSignature ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ wordBreak: 'break-all', flex: 1 }}>{generatedSignature}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(generatedSignature)}
                title="Copy signature"
                style={{ 
                  marginLeft: '1rem', 
                  flexShrink: 0,
                  backgroundColor: isCopied ? 'var(--success-color)' : 'transparent',
                  color: isCopied ? 'white' : 'var(--text-secondary)',
                  borderColor: isCopied ? 'var(--success-color)' : 'var(--border-color)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Enter payload and secret to generate signature</span>
          )}
        </div>
        
        {/* Encoding Selector */}
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Output Encoding:
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setEncoding('hex')}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                border: `1px solid ${encoding === 'hex' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '0.25rem',
                backgroundColor: encoding === 'hex' ? 'var(--primary-color)' : 'var(--background-color)',
                color: encoding === 'hex' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Hex
            </button>
            <button
              type="button"
              onClick={() => setEncoding('base64')}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                border: `1px solid ${encoding === 'base64' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '0.25rem',
                backgroundColor: encoding === 'base64' ? 'var(--primary-color)' : 'var(--background-color)',
                color: encoding === 'base64' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Base64
            </button>
          </div>
        </div>
      </div>

      {/* Received Signature Input for Verification */}
      <div className="form-group">
        <label htmlFor="receivedSignature">Received Signature (for verification)</label>
        <input
          id="receivedSignature"
          type="text"
          className="form-control"
          value={receivedSignature}
          onChange={(e) => setReceivedSignature(e.target.value)}
          placeholder={`Paste the ${encoding} signature you received to verify...`}
        />
        {receivedSignature.trim() && !secret.trim() && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--warning-color)', 
            marginTop: '0.25rem',
            fontStyle: 'italic'
          }}>
            ⚠️ Please enter the webhook secret above to verify this signature
          </div>
        )}
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <div className="form-group">
          <div className={`verification-result ${verificationResult.type}`}>
            <span>{verificationResult.message}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}; 