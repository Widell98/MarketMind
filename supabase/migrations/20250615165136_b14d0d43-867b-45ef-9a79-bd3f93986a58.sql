
-- Insert some default categories for stock cases
INSERT INTO case_categories (name, color) VALUES
('Teknologi', '#3B82F6'),
('Bilindustri', '#EF4444'),
('Finans & Bank', '#10B981'),
('Investmentbolag', '#8B5CF6'),
('Fastighet', '#F59E0B'),
('Konsumtion', '#EC4899'),
('Energi & Råvaror', '#14B8A6'),
('Hälsovård', '#84CC16'),
('Telekom', '#6366F1'),
('Industri', '#F97316')
ON CONFLICT (name) DO NOTHING;
