export type ScrollBehavior = 'pinned' | 'scrolling_text_over_parallax' | 'horizontal_pin' | 'vertical_scroll' | 'scrolling_panels';

export interface SceneConfig {
  id: string;
  title: string;
  scrollBehavior: ScrollBehavior;
  visualContent: string;
  interaction?: string;
  features?: FeatureSpec[];
}

export interface FeatureSpec {
  id: string;
  label: string;
  description: string;
  icon?: string; // Lucide icon name or asset path
  original_007_ref?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: 'USD' | 'BTC' | 'SATS';
  interval: 'month' | 'year' | 'one-time';
  features: string[];
  provider: 'stripe' | 'bitcoin402';
  paymentLink?: string; // Stripe Link or similar
}

export interface AvatarTemplate {
  id: string;
  name: string;
  style: 'noir' | 'anime' | 'cyberpunk';
  previewImage: string;
}

export interface PipelineStageCard {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number; // 0-100
}
