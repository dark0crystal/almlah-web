export default function AboutUs() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                        About Us
                    </h1>
                    <p className="mt-4 text-xl text-gray-600">
                        Learn more about our mission and team
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            We are dedicated to helping people discover the beauty and culture of Oman. 
                            Our platform connects travelers with authentic local experiences, from hidden 
                            gems to popular destinations, creating memories that last a lifetime.
                        </p>
                    </div>

                    {/* Column 2 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Our Team</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Our passionate team consists of local experts, travel enthusiasts, and 
                            technology professionals who work together to create the best possible 
                            experience for exploring Oman. We combine local knowledge with modern 
                            technology to guide your journey.
                        </p>
                    </div>

                    {/* Column 3 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            We believe in sustainable tourism, cultural preservation, and community 
                            support. Our platform promotes responsible travel that benefits local 
                            communities while preserving Oman's natural beauty and rich heritage 
                            for future generations.
                        </p>
                    </div>
                </div>

                {/* Additional content section */}
                <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Join Our Journey</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                            Whether you're a first-time visitor or a longtime resident, Almlah helps you 
                            discover new perspectives on this incredible country. Join thousands of 
                            explorers who trust us to guide their adventures in Oman.
                        </p>
                        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Start Exploring
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}