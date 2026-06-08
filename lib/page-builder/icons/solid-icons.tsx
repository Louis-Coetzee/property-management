'use client';

import {
  // Vehicles & Transportation
  Car, Truck, Bike, Bus, Plane, Ship, Train, Rocket, Helicopter, Ambulance,
  Forklift, Tractor, Scooter, Anchor, Navigation, Compass,

  // Animals & Nature
  Bird, Bug, Cat, Dog, Fish, Rabbit, Squirrel, Turtle, Leaf, TreePine,
  Flower2, Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Thermometer,
  Flame, Droplets, Waves, Mountain, Zap,

  // Business & Finance
  Briefcase, Building, Building2, Store, Warehouse, Factory, Landmark,
  DollarSign, Coins, CreditCard, Wallet, PiggyBank, Receipt, Calculator,
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart, Target, Goal,

  // Communication & Social
  MessageCircle, MessageSquare, Phone, PhoneCall, Mail, AtSign, Send,
  Share2, Users, UserPlus, Heart, ThumbsUp, Star, Award, Trophy, Medal,
  Handshake, Smile, UserCheck, Contact,

  // Technology & Development
  Monitor, Laptop, Smartphone, Tablet, Server, HardDrive, Database, CloudCog,
  Code, Terminal, Cpu, Wifi, Bluetooth, Signal, Radio, Cable,
  Lock, Shield, Key, Fingerprint, Scan, Eye, ScanFace,

  // Media & Content
  Camera, Video, Film, Music, Mic, Headphones, Speaker,
  Image, FileText, File, FolderOpen, Archive, Bookmark, Tag,
  Pencil, Pen, Brush, Palette, Aperture, Focus,

  // Shopping & E-commerce
  ShoppingCart, ShoppingBag, Package, Gift, Box,
  Barcode, QrCode, Percent,

  // Home & Lifestyle
  Home, Bed, Bath, Sofa, Lamp, DoorOpen,
  Utensils, Coffee, Wine, ChefHat, Tv,
  Armchair, Fan,

  // Education & Learning
  GraduationCap, BookOpen, Book, Notebook, FileQuestion, HelpCircle,
  Lightbulb, Brain, Sparkles, Globe, Map,

  // Health & Medical
  Activity, Stethoscope, Pill, Syringe, PlusSquare,
  Bandage, Accessibility,

  // Security & Safety
  ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle,
  XCircle, Info, Ban,

  // Time & Calendar
  Clock, Calendar, CalendarDays, Timer, Hourglass, History, AlarmClock,
  RefreshCw,

  // Tools & Settings
  Settings, Wrench, Hammer, Cog, Sliders, ToggleLeft,
  Power, Plug, Battery, Fuel, Gauge,

  // Arrows & Navigation
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
  Move, ExternalLink, Link, Maximize2, Minimize2, Expand, Shrink,

  // Files & Documents
  FilePlus, FileCheck, FileX, FileEdit, Files, FolderPlus, Folder,

  // Miscellaneous
  Crown, Gem, Diamond, Puzzle, Layers, Grid, List,
  Check, X, Plus, Minus, MoreHorizontal, MoreVertical, Hash, Asterisk,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Category type
export interface IconCategory {
  id: string;
  label: string;
  icons: IconOption[];
}

export interface IconOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// All available solid icons organized by category
export const SOLID_ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'vehicles',
    label: 'Vehicles & Transportation',
    icons: [
      { value: 'car', label: 'Car', icon: Car },
      { value: 'truck', label: 'Truck', icon: Truck },
      { value: 'bike', label: 'Bike', icon: Bike },
      { value: 'bus', label: 'Bus', icon: Bus },
      { value: 'plane', label: 'Airplane', icon: Plane },
      { value: 'ship', label: 'Ship', icon: Ship },
      { value: 'train', label: 'Train', icon: Train },
      { value: 'rocket', label: 'Rocket', icon: Rocket },
      { value: 'helicopter', label: 'Helicopter', icon: Helicopter },
      { value: 'ambulance', label: 'Ambulance', icon: Ambulance },
      { value: 'forklift', label: 'Forklift', icon: Forklift },
      { value: 'tractor', label: 'Tractor', icon: Tractor },
      { value: 'scooter', label: 'Scooter', icon: Scooter },
      { value: 'anchor', label: 'Anchor', icon: Anchor },
      { value: 'navigation', label: 'Navigation', icon: Navigation },
      { value: 'compass', label: 'Compass', icon: Compass },
    ],
  },
  {
    id: 'animals',
    label: 'Animals & Nature',
    icons: [
      { value: 'bird', label: 'Bird', icon: Bird },
      { value: 'bug', label: 'Bug', icon: Bug },
      { value: 'cat', label: 'Cat', icon: Cat },
      { value: 'dog', label: 'Dog', icon: Dog },
      { value: 'fish', label: 'Fish', icon: Fish },
      { value: 'rabbit', label: 'Rabbit', icon: Rabbit },
      { value: 'squirrel', label: 'Squirrel', icon: Squirrel },
      { value: 'turtle', label: 'Turtle', icon: Turtle },
      { value: 'leaf', label: 'Leaf', icon: Leaf },
      { value: 'tree-pine', label: 'Pine Tree', icon: TreePine },
      { value: 'flower', label: 'Flower', icon: Flower2 },
      { value: 'sun', label: 'Sun', icon: Sun },
      { value: 'moon', label: 'Moon', icon: Moon },
      { value: 'cloud', label: 'Cloud', icon: Cloud },
      { value: 'cloud-rain', label: 'Rain Cloud', icon: CloudRain },
      { value: 'cloud-snow', label: 'Snow Cloud', icon: CloudSnow },
      { value: 'wind', label: 'Wind', icon: Wind },
      { value: 'flame', label: 'Flame', icon: Flame },
      { value: 'droplets', label: 'Droplets', icon: Droplets },
      { value: 'waves', label: 'Waves', icon: Waves },
      { value: 'mountain', label: 'Mountain', icon: Mountain },
    ],
  },
  {
    id: 'business',
    label: 'Business & Finance',
    icons: [
      { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
      { value: 'building', label: 'Building', icon: Building },
      { value: 'building-2', label: 'Office', icon: Building2 },
      { value: 'store', label: 'Store', icon: Store },
      { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
      { value: 'factory', label: 'Factory', icon: Factory },
      { value: 'landmark', label: 'Landmark', icon: Landmark },
      { value: 'dollar-sign', label: 'Dollar', icon: DollarSign },
      { value: 'coins', label: 'Coins', icon: Coins },
      { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
      { value: 'wallet', label: 'Wallet', icon: Wallet },
      { value: 'piggy-bank', label: 'Piggy Bank', icon: PiggyBank },
      { value: 'receipt', label: 'Receipt', icon: Receipt },
      { value: 'calculator', label: 'Calculator', icon: Calculator },
      { value: 'trending-up', label: 'Trending Up', icon: TrendingUp },
      { value: 'trending-down', label: 'Trending Down', icon: TrendingDown },
      { value: 'bar-chart', label: 'Bar Chart', icon: BarChart3 },
      { value: 'pie-chart', label: 'Pie Chart', icon: PieChart },
      { value: 'line-chart', label: 'Line Chart', icon: LineChart },
      { value: 'target', label: 'Target', icon: Target },
      { value: 'goal', label: 'Goal', icon: Goal },
    ],
  },
  {
    id: 'communication',
    label: 'Communication & Social',
    icons: [
      { value: 'message-circle', label: 'Message', icon: MessageCircle },
      { value: 'message-square', label: 'Chat', icon: MessageSquare },
      { value: 'phone', label: 'Phone', icon: Phone },
      { value: 'phone-call', label: 'Phone Call', icon: PhoneCall },
      { value: 'mail', label: 'Mail', icon: Mail },
      { value: 'at-sign', label: 'Email', icon: AtSign },
      { value: 'send', label: 'Send', icon: Send },
      { value: 'share', label: 'Share', icon: Share2 },
      { value: 'users', label: 'Users', icon: Users },
      { value: 'user-plus', label: 'Add User', icon: UserPlus },
      { value: 'heart', label: 'Heart', icon: Heart },
      { value: 'thumbs-up', label: 'Thumbs Up', icon: ThumbsUp },
      { value: 'star', label: 'Star', icon: Star },
      { value: 'award', label: 'Award', icon: Award },
      { value: 'trophy', label: 'Trophy', icon: Trophy },
      { value: 'medal', label: 'Medal', icon: Medal },
      { value: 'handshake', label: 'Handshake', icon: Handshake },
      { value: 'smile', label: 'Smile', icon: Smile },
      { value: 'user-check', label: 'User Check', icon: UserCheck },
      { value: 'contact', label: 'Contact', icon: Contact },
    ],
  },
  {
    id: 'technology',
    label: 'Technology & Development',
    icons: [
      { value: 'monitor', label: 'Monitor', icon: Monitor },
      { value: 'laptop', label: 'Laptop', icon: Laptop },
      { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
      { value: 'tablet', label: 'Tablet', icon: Tablet },
      { value: 'server', label: 'Server', icon: Server },
      { value: 'hard-drive', label: 'Hard Drive', icon: HardDrive },
      { value: 'database', label: 'Database', icon: Database },
      { value: 'cloud-cog', label: 'Cloud', icon: CloudCog },
      { value: 'code', label: 'Code', icon: Code },
      { value: 'terminal', label: 'Terminal', icon: Terminal },
      { value: 'cpu', label: 'CPU', icon: Cpu },
      { value: 'wifi', label: 'WiFi', icon: Wifi },
      { value: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
      { value: 'signal', label: 'Signal', icon: Signal },
      { value: 'radio', label: 'Radio', icon: Radio },
      { value: 'cable', label: 'Cable', icon: Cable },
      { value: 'lock', label: 'Lock', icon: Lock },
      { value: 'shield', label: 'Shield', icon: Shield },
      { value: 'key', label: 'Key', icon: Key },
      { value: 'fingerprint', label: 'Fingerprint', icon: Fingerprint },
      { value: 'scan', label: 'Scan', icon: Scan },
      { value: 'eye', label: 'Eye', icon: Eye },
      { value: 'scan-face', label: 'Face ID', icon: ScanFace },
    ],
  },
  {
    id: 'media',
    label: 'Media & Content',
    icons: [
      { value: 'camera', label: 'Camera', icon: Camera },
      { value: 'video', label: 'Video', icon: Video },
      { value: 'film', label: 'Film', icon: Film },
      { value: 'music', label: 'Music', icon: Music },
      { value: 'mic', label: 'Microphone', icon: Mic },
      { value: 'headphones', label: 'Headphones', icon: Headphones },
      { value: 'speaker', label: 'Speaker', icon: Speaker },
      { value: 'image', label: 'Image', icon: Image },
      { value: 'file-text', label: 'Document', icon: FileText },
      { value: 'file', label: 'File', icon: File },
      { value: 'folder', label: 'Folder', icon: FolderOpen },
      { value: 'archive', label: 'Archive', icon: Archive },
      { value: 'bookmark', label: 'Bookmark', icon: Bookmark },
      { value: 'tag', label: 'Tag', icon: Tag },
      { value: 'pencil', label: 'Pencil', icon: Pencil },
      { value: 'pen', label: 'Pen', icon: Pen },
      { value: 'brush', label: 'Brush', icon: Brush },
      { value: 'palette', label: 'Palette', icon: Palette },
      { value: 'aperture', label: 'Aperture', icon: Aperture },
      { value: 'focus', label: 'Focus', icon: Focus },
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping & E-commerce',
    icons: [
      { value: 'shopping-cart', label: 'Cart', icon: ShoppingCart },
      { value: 'shopping-bag', label: 'Shopping Bag', icon: ShoppingBag },
      { value: 'package', label: 'Package', icon: Package },
      { value: 'gift', label: 'Gift', icon: Gift },
      { value: 'box', label: 'Box', icon: Box },
      { value: 'barcode', label: 'Barcode', icon: Barcode },
      { value: 'qr-code', label: 'QR Code', icon: QrCode },
      { value: 'percent', label: 'Percent', icon: Percent },
      { value: 'tag-price', label: 'Price Tag', icon: Tag },
    ],
  },
  {
    id: 'home',
    label: 'Home & Lifestyle',
    icons: [
      { value: 'home', label: 'Home', icon: Home },
      { value: 'bed', label: 'Bed', icon: Bed },
      { value: 'bath', label: 'Bath', icon: Bath },
      { value: 'sofa', label: 'Sofa', icon: Sofa },
      { value: 'lamp', label: 'Lamp', icon: Lamp },
      { value: 'door', label: 'Door', icon: DoorOpen },
      { value: 'utensils', label: 'Utensils', icon: Utensils },
      { value: 'coffee', label: 'Coffee', icon: Coffee },
      { value: 'wine', label: 'Wine', icon: Wine },
      { value: 'chef-hat', label: 'Chef Hat', icon: ChefHat },
      { value: 'tv', label: 'TV', icon: Tv },
      { value: 'armchair', label: 'Armchair', icon: Armchair },
      { value: 'fan', label: 'Fan', icon: Fan },
    ],
  },
  {
    id: 'education',
    label: 'Education & Learning',
    icons: [
      { value: 'graduation-cap', label: 'Graduation', icon: GraduationCap },
      { value: 'book-open', label: 'Open Book', icon: BookOpen },
      { value: 'book', label: 'Book', icon: Book },
      { value: 'notebook', label: 'Notebook', icon: Notebook },
      { value: 'file-question', label: 'Question', icon: FileQuestion },
      { value: 'help-circle', label: 'Help', icon: HelpCircle },
      { value: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
      { value: 'brain', label: 'Brain', icon: Brain },
      { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
      { value: 'globe', label: 'Globe', icon: Globe },
      { value: 'map', label: 'Map', icon: Map },
    ],
  },
  {
    id: 'health',
    label: 'Health & Medical',
    icons: [
      { value: 'heart-health', label: 'Heart Health', icon: Heart },
      { value: 'activity', label: 'Activity', icon: Activity },
      { value: 'stethoscope', label: 'Stethoscope', icon: Stethoscope },
      { value: 'pill', label: 'Pill', icon: Pill },
      { value: 'syringe', label: 'Syringe', icon: Syringe },
      { value: 'plus-square', label: 'Medical Plus', icon: PlusSquare },
      { value: 'bandage', label: 'Bandage', icon: Bandage },
      { value: 'accessibility', label: 'Accessibility', icon: Accessibility },
    ],
  },
  {
    id: 'security',
    label: 'Security & Safety',
    icons: [
      { value: 'shield-check', label: 'Shield Check', icon: ShieldCheck },
      { value: 'shield-alert', label: 'Shield Alert', icon: ShieldAlert },
      { value: 'alert-triangle', label: 'Warning', icon: AlertTriangle },
      { value: 'alert-circle', label: 'Alert', icon: AlertCircle },
      { value: 'check-circle', label: 'Check Circle', icon: CheckCircle },
      { value: 'x-circle', label: 'X Circle', icon: XCircle },
      { value: 'info', label: 'Info', icon: Info },
      { value: 'ban', label: 'Ban', icon: Ban },
    ],
  },
  {
    id: 'time',
    label: 'Time & Calendar',
    icons: [
      { value: 'clock', label: 'Clock', icon: Clock },
      { value: 'calendar', label: 'Calendar', icon: Calendar },
      { value: 'calendar-days', label: 'Calendar Days', icon: CalendarDays },
      { value: 'timer', label: 'Timer', icon: Timer },
      { value: 'hourglass', label: 'Hourglass', icon: Hourglass },
      { value: 'history', label: 'History', icon: History },
      { value: 'alarm-clock', label: 'Alarm', icon: AlarmClock },
      { value: 'refresh', label: 'Refresh', icon: RefreshCw },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Settings',
    icons: [
      { value: 'settings', label: 'Settings', icon: Settings },
      { value: 'wrench', label: 'Wrench', icon: Wrench },
      { value: 'hammer', label: 'Hammer', icon: Hammer },
      { value: 'cog', label: 'Cog', icon: Cog },
      { value: 'sliders', label: 'Sliders', icon: Sliders },
      { value: 'toggle', label: 'Toggle', icon: ToggleLeft },
      { value: 'power', label: 'Power', icon: Power },
      { value: 'plug', label: 'Plug', icon: Plug },
      { value: 'battery', label: 'Battery', icon: Battery },
      { value: 'fuel', label: 'Fuel', icon: Fuel },
      { value: 'gauge', label: 'Gauge', icon: Gauge },
    ],
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    icons: [
      { value: 'crown', label: 'Crown', icon: Crown },
      { value: 'gem', label: 'Gem', icon: Gem },
      { value: 'diamond', label: 'Diamond', icon: Diamond },
      { value: 'puzzle', label: 'Puzzle', icon: Puzzle },
      { value: 'layers', label: 'Layers', icon: Layers },
      { value: 'grid', label: 'Grid', icon: Grid },
      { value: 'list', label: 'List', icon: List },
      { value: 'check', label: 'Check', icon: Check },
      { value: 'x', label: 'X', icon: X },
      { value: 'plus', label: 'Plus', icon: Plus },
      { value: 'minus', label: 'Minus', icon: Minus },
      { value: 'hash', label: 'Hash', icon: Hash },
      { value: 'zap', label: 'Zap', icon: Zap },
    ],
  },
];

// Flat list of all icons for quick lookup
export const ALL_SOLID_ICONS: Record<string, LucideIcon> = SOLID_ICON_CATEGORIES.reduce(
  (acc, category) => {
    category.icons.forEach((iconOption) => {
      acc[iconOption.value] = iconOption.icon;
    });
    return acc;
  },
  {} as Record<string, LucideIcon>
);

// Get icon component by value
export function getSolidIconComponent(iconValue: string): LucideIcon | null {
  return ALL_SOLID_ICONS[iconValue] || null;
}

// Get icon label by value
export function getSolidIconLabel(iconValue: string): string {
  for (const category of SOLID_ICON_CATEGORIES) {
    const icon = category.icons.find((i) => i.value === iconValue);
    if (icon) return icon.label;
  }
  return iconValue;
}

// Default icon color presets
export const ICON_COLOR_PRESETS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#1e293b', label: 'Slate' },
  { value: '#000000', label: 'Black' },
];
