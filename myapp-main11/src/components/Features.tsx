import React from 'react';

const Features = () => {
  const features = [
    {
      title: "Easy to Use",
      description: "Intuitive interface that makes design accessible to everyone.",
      icon: "🎨"
    },
    {
      title: "Powerful Tools",
      description: "Advanced features for professional designers and teams.",
      icon: "⚡"
    },
    {
      title: "Collaboration",
      description: "Work together seamlessly with real-time collaboration.",
      icon: "👥"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 