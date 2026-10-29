import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Headphones,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Utensils,
  Armchair,
  Sparkles,
  ShoppingBasket,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Car,
  Watch,
  HeartPulse,
  Grid
} from 'lucide-react';
import { api } from '../../services/api';
import { ICategory } from '../../types';

// Map icon names to Lucide icons
const iconMap: Record<string, React.ReactNode> = {
  Headphones: <Headphones className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Laptop: <Laptop className="w-4 h-4" />,
  Shirt: <Shirt className="w-4 h-4" />,
  Footprints: <Footprints className="w-4 h-4" />,
  Utensils: <Utensils className="w-4 h-4" />,
  Armchair: <Armchair className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  ShoppingBasket: <ShoppingBasket className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Gamepad2: <Gamepad2 className="w-4 h-4" />,
  Dumbbell: <Dumbbell className="w-4 h-4" />,
  Car: <Car className="w-4 h-4" />,
  Watch: <Watch className="w-4 h-4" />,
  HeartPulse: <HeartPulse className="w-4 h-4" />
};

export const CategoryBar: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        // silent
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-white border-b border-aura-border shadow-subtle overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 sm:gap-2 py-2.5 min-w-max">
        <Link
          to="/products"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            !currentCategory
              ? 'bg-aura-navy text-white shadow-sm'
              : 'text-aura-textSecondary hover:text-aura-navy hover:bg-gray-100'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>All Departments</span>
        </Link>

        {categories.map(cat => {
          const isActive = currentCategory === cat.slug;
          return (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-aura-indigo text-white font-semibold shadow-sm'
                  : 'text-aura-textSecondary hover:text-aura-indigo hover:bg-indigo-50/60'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-aura-indigo'}>
                {cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : <Sparkles className="w-3.5 h-3.5" />}
              </span>
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

