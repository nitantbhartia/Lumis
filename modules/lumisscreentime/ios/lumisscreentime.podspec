Pod::Spec.new do |s|
  s.name           = 'lumisscreentime'
  s.version        = '1.0.0'
  s.summary        = 'Lumis Screen Time Module'
  s.description    = 'Native module for Screen Time management in Lumis'
  s.author         = 'Lumis'
  s.homepage       = 'https://lumis.app'
  s.platforms      = { :ios => '15.0' }
  s.source         = { :git => 'https://github.com/lumis.git', :tag => s.version.to_s }
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.preserve_paths = 'ios/**/*.{h,m,swift}'
  s.dependency 'ExpoModulesCore'

  s.swift_version = '5.4'
end
