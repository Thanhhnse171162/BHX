'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  VIETNAM_LOCATIONS, 
  getDistrictsByCity, 
  getWardsByDistrict,
  type City, 
  type District,
  type Ward 
} from '@/data/locations'

type Step = 'city' | 'district' | 'ward'

interface DeliveryLocation {
  city: City | null
  district: District | null
  ward: Ward | null
}

export function DeliveryLocationSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('city')
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation>({
    city: null,
    district: null,
    ward: null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [enableGPS, setEnableGPS] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load saved location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deliveryLocation')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSelectedLocation(parsed)
      } catch {
        console.error('Failed to parse saved location')
      }
    }
  }, [])

  // Save location to localStorage
  useEffect(() => {
    if (selectedLocation.city) {
      localStorage.setItem('deliveryLocation', JSON.stringify(selectedLocation))
    }
  }, [selectedLocation])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setCurrentStep('city')
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySelect = (city: City) => {
    setSelectedLocation({ city, district: null, ward: null })
    setCurrentStep('district')
    setSearchQuery('')
  }

  const handleDistrictSelect = (district: District) => {
    setSelectedLocation(prev => ({ ...prev, district, ward: null }))
    const wards = getWardsByDistrict(selectedLocation.city!.id, district.id)
    if (wards.length > 0) {
      setCurrentStep('ward')
    } else {
      setIsOpen(false)
      setCurrentStep('city')
    }
    setSearchQuery('')
  }

  const handleWardSelect = (ward: Ward) => {
    setSelectedLocation(prev => ({ ...prev, ward }))
    setIsOpen(false)
    setCurrentStep('city')
    setSearchQuery('')
  }

  const handleBack = () => {
    if (currentStep === 'ward') {
      setCurrentStep('district')
    } else if (currentStep === 'district') {
      setCurrentStep('city')
    }
    setSearchQuery('')
  }

  const districts = selectedLocation.city ? getDistrictsByCity(selectedLocation.city.id) : []
  const wards = selectedLocation.city && selectedLocation.district 
    ? getWardsByDistrict(selectedLocation.city.id, selectedLocation.district.id) 
    : []

  const filteredCities = VIETNAM_LOCATIONS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDistricts = districts.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredWards = wards.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-[13px] text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <div className="text-left">
          <div className="text-[11px] font-medium text-green-100">Giao hàng đến</div>
          <div className="font-bold text-white">
            {selectedLocation.ward 
              ? `${selectedLocation.ward.name}` 
              : selectedLocation.district
              ? `${selectedLocation.district.name}`
              : selectedLocation.city
              ? `${selectedLocation.city.name}`
              : 'Chọn khu vực'}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-green-100 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modal Dropdown - Dark Theme with Red Accent */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[420px] bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header Bar - Green Accent */}
          <div className="h-14 bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-between px-4">
            {currentStep !== 'city' && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="font-extrabold text-white text-[15px] flex-1 text-center">
              {currentStep === 'city' && 'Chọn Tỉnh/Thành phố'}
              {currentStep === 'district' && `Chọn Quận/Huyện tại ${selectedLocation.city?.name}`}
              {currentStep === 'ward' && `Chọn Phường/Xã tại ${selectedLocation.district?.name}`}
            </h3>
            <button
              onClick={() => {
                setIsOpen(false)
                setCurrentStep('city')
                setSearchQuery('')
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* GPS Option */}
          <div className="p-3 border-b border-gray-800 bg-[#252525]">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={enableGPS}
                  onChange={(e) => setEnableGPS(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">Sử dụng vị trí hiện tại</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Tự động xác định vị trí của bạn</p>
              </div>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-gray-800 bg-[#1f1f1f]">
            <div className="relative">
              <input
                type="text"
                placeholder={
                  currentStep === 'city' ? 'Tìm tỉnh/thành phố...' :
                  currentStep === 'district' ? 'Tìm quận/huyện...' :
                  'Tìm phường/xã...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-11 text-[13px] bg-[#2a2a2a] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
              />
              <svg 
                className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="h-[400px] overflow-y-auto bg-[#1a1a1a] custom-scrollbar">
            {currentStep === 'city' && filteredCities.map((city, index) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-800 transition-all ${
                  selectedLocation.city?.id === city.id
                    ? 'bg-green-600/10 text-green-500'
                    : 'hover:bg-[#252525] text-gray-300'
                } ${index === 0 ? '' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{city.name}</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}

            {currentStep === 'district' && filteredDistricts.map((district, index) => (
              <button
                key={district.id}
                onClick={() => handleDistrictSelect(district)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-800 transition-all ${
                  selectedLocation.district?.id === district.id
                    ? 'bg-green-600/10 text-green-500'
                    : 'hover:bg-[#252525] text-gray-300'
                } ${index === 0 ? '' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{district.name}</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}

            {currentStep === 'ward' && filteredWards.map((ward, index) => (
              <button
                key={ward.id}
                onClick={() => handleWardSelect(ward)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-800 transition-all ${
                  selectedLocation.ward?.id === ward.id
                    ? 'bg-green-600/10 text-green-500'
                    : 'hover:bg-[#252525] text-gray-300'
                } ${index === 0 ? '' : ''}`}
              >
                <span className="text-[13px] font-semibold">{ward.name}</span>
              </button>
            ))}

            {/* No results */}
            {((currentStep === 'city' && filteredCities.length === 0) ||
              (currentStep === 'district' && filteredDistricts.length === 0) ||
              (currentStep === 'ward' && filteredWards.length === 0)) && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <svg className="w-16 h-16 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 text-[13px] font-medium">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {selectedLocation.city && (
            <div className="p-4 border-t border-gray-800 bg-[#1f1f1f]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-white">
                    {selectedLocation.ward && `${selectedLocation.ward.name}, `}
                    {selectedLocation.district && `${selectedLocation.district.name}, `}
                    {selectedLocation.city.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    🚚 Thời gian giao hàng: 1-2 giờ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #505050;
        }
      `}</style>
    </div>
  )
}
