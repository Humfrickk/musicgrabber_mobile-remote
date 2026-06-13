import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getSearchArtwork } from '@/src/api/search';

interface CoverImageProps {
  /** Direct image URL (e.g. search `thumbnail` or Cover Art Archive). */
  uri?: string | null;
  /** Fallback: fetch GET /api/search/artwork when no uri. */
  artist?: string;
  title?: string;
  source?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function CoverImage({
  uri: uriProp,
  artist,
  title,
  source,
  size = 64,
  style,
  imageStyle,
}: CoverImageProps) {
  const [uri, setUri] = useState<string | null>(uriProp ?? null);
  const [loading, setLoading] = useState(Boolean(uriProp?.trim()));
  const [failed, setFailed] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function resolveUri() {
      const directUri = uriProp?.trim() || null;
      if (directUri) {
        setUri(directUri);
        setLoading(true);
        setFailed(false);
        setUsedFallback(false);
        return;
      }

      const a = artist?.trim();
      const t = title?.trim();
      if (!a || !t) {
        setUri(null);
        setLoading(false);
        setFailed(true);
        return;
      }

      setLoading(true);
      setFailed(false);
      try {
        const data = await getSearchArtwork(a, t, controller.signal);
        if (cancelled) return;
        if (data.url) {
          setUri(data.url);
          setUsedFallback(true);
        } else {
          setUri(null);
          setFailed(true);
        }
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        setUri(null);
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void resolveUri();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [uriProp, artist, title]);

  const tryArtworkFallback = async () => {
    const a = artist?.trim();
    const t = title?.trim();
    if (!a || !t || usedFallback) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSearchArtwork(a, t);
      if (data.url) {
        setUri(data.url);
        setFailed(false);
        setUsedFallback(true);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, [loading, uri]);

  const frameStyle = [
    styles.frame,
    { width: size, height: size, borderRadius: size * 0.125 },
    style,
  ];
  const isSoulseek = source === 'soulseek';

  if (uri && !failed) {
    return (
      <View style={frameStyle}>
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size * 0.125 }, imageStyle]}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setUri(null);
            void tryArtworkFallback();
          }}
        />
        {loading ? (
          <View style={[styles.overlay, { borderRadius: size * 0.125 }]}>
            <ActivityIndicator size="small" color="#7C6BF0" />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        frameStyle,
        isSoulseek ? styles.soulseekPlaceholder : styles.placeholder,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isSoulseek ? '#FFFFFF' : '#7C6BF0'} />
      ) : (
        <MaterialCommunityIcons
          name="music"
          size={size * 0.4}
          color={isSoulseek ? '#FFFFFF' : '#9A9AAA'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#3A3A4A',
  },
  image: {
    backgroundColor: '#2A2A38',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soulseekPlaceholder: {
    backgroundColor: '#2D7DD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
