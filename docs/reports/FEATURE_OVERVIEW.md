# Avatar Resizer - Feature Overview

## Core Functionality

**Avatar Resizer** is a browser-based image resizing tool that transforms a single source image into multiple target sizes simultaneously. All processing happens client-side without requiring server uploads or internet connectivity.

## Image Input Features

### Upload Methods

- **Drag & Drop**: Drop images anywhere on the page
- **File Browser**: Click to select files from your device
- **Image Replacement**: Easily switch to a different source image

### Supported Input Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### Input Validation

- File size limit: 50MB maximum
- Automatic format validation
- Clear error messages for invalid files

## Size Configuration Features

### Target Dimensions

- **Custom Sizes**: Set any width and height in pixels
- **Multiple Outputs**: Process unlimited number of different sizes
- **Default Presets**: Includes Tiny (100×100), Small (200×200), Medium (400×400), and Large (800×800) configurations

### Crop Modes

- **Fit**: Maintains aspect ratio, adds letterboxing if needed (background color and transparency configurable)
- **Fill**: Crops image to exact dimensions, may remove parts of the image
- **Stretch**: Ignores aspect ratio, may distort the image

### Centering

Crop fit centering is handled by defining a vertical and horizontal percentage offset of the center point used for cropping.

- **Preset Options**: Top-Left, Top-Center, Top-Right, Center-Left, Center (Default), Center-Right, Bottom-Left, Bottom-Center, Bottom-Right (adjusts offsets accordingly)
- **Vertical Offset**: 0-100% (0 = top, 50 = center, 100 = bottom)
- **Horizontal Offset**: 0-100% (0 = left, 50 = center, 100 = right)

### Resize Quality Options

- **High Quality**: Bicubic algorithm for smoothest results
- **Medium Quality**: Bilinear algorithm for balanced performance
- **Low Quality**: Box algorithm for faster processing
- **Fastest**: Nearest neighbor for maximum speed

## Output Format Features

### Available Formats

- **PNG**: Best quality, supports transparency
- **JPEG**: Smaller file sizes, good for photos
- **WebP**: Modern format with excellent compression
- **GIF**: Legacy support with color reduction
- **ICO**: Windows icon format

### Format-Specific Controls

- **JPEG Quality**: Adjustable from 10-100% in 5% increments
- **WebP Quality**: Adjustable from 10-100% in 5% increments
- **PNG Compression**: 10 levels (0-9) for file size optimization
- **GIF Colors**: Reducible from 2-256 colors

## Shape and Styling Features

### Shape Options

- **Rectangle**: Standard rectangular output (default)
- **Rounded Rectangle**: Rectangle with customizable corner radius (1-100px)
- **Circle**: Circular cropping with automatic center calculation and customizable background

### Corner Radius Control

- **Configurable Radius**: For rounded rectangles, set corner radius from 1-100 pixels
- **Smart Clamping**: Automatically limits radius to half the smallest dimension for perfect curves

### Background Control

- **Color Picker**: Choose any background color with hex color display
- **Transparency**: Optional transparent backgrounds for PNG, WebP, and GIF formats
- **Smart Background Handling**: Automatic background application for formats that don't support transparency (JPEG, ICO)

## File Naming Features

### Filename Patterns

Customizable filename templates using placeholders:

- `{original_name}` — Original filename without extension
- `{original_ext}` — Original file extension (e.g., `png`, `jpg`)
- `{original_width}` — Original image width in pixels
- `{original_height}` — Original image height in pixels
- `{name}` — Size configuration name
- `{width}` — Target width in pixels
- `{height}` — Target height in pixels
- `{format}` — Output format name (e.g., `PNG`, `JPEG`, `WebP`)
- `{format_ext}` — Output file extension (e.g., `png`, `jpg`, `webp`)
- `{crop_mode}` — Crop mode used (`Fit`, `Fill`, `Stretch`)
- `{shape}` — Output shape (`Rectangle`, `Rounded`, `Circle`)
- `{quality_text}` — Quality description or percentage (e.g., `High`, `85%`)
- `{date}` — Processing date (ISO `YYYY-MM-DD`)
- `{time}` — Processing time (`HHMMSS`)
- `{timestamp}` — Unix timestamp (seconds since epoch)

### Formatting Support

Template placeholders support basic formatting options:

- **Zero-padding for numbers**: Add digits after colon for padding (e.g., `{width:4}` → `0200`)
- **Case transformation for text**: Use `upper` or `lower` (e.g., `{format:upper}` → `PNG`, `{format:lower}` → `png`)

### Example Patterns

- `{original_name}_{width}x{height}.{format_ext}` → `avatar_200x200.png` (default)
- `{original_name}_{width:4}x{height:4}_{format:lower}.{format_ext}` → `avatar_0200x0200_png.png`
- `{name}_{format}_{timestamp}.{format_ext}` → `Small_PNG_1696518645.png`

## Processing Features

### Batch Processing

- **One-Click Processing**: Process all configured sizes simultaneously
- **Auto-Processing**: Optional automatic processing when images are uploaded
- **Progress Feedback**: Visual indicators during processing
- **Error Handling**: Clear messages for processing failures

### Processing Control

- **Manual Trigger**: Process button for on-demand processing
- **Auto-Process Toggle**: Enable/disable automatic processing when images are uploaded
- **Individual Control**: Edit each size configuration independently
- **Smart Button States**: Process button automatically enables/disables based on image and configuration availability
- **Dynamic Status Messages**: Real-time feedback about current application state

## Download Features

### Download Options

- **Individual Downloads**: Download specific processed images
- **Bulk Download**: Download all images as a ZIP file
- **Instant Access**: No waiting for server processing

### File Organization

- **Organized Naming**: Consistent filename patterns
- **ZIP Packaging**: All images bundled for easy distribution
- **Browser Downloads**: Standard browser download mechanism

## User Interface Features

### Layout and Design

- **Two-Column Layout**: Upload area and configuration sidebar with CSS Grid
- **Responsive Design**: Automatically adapts to desktop, tablet, and mobile devices
- **Clean Interface**: Minimal, focused design with modern styling
- **Visual Feedback**: Clear status indicators, success messages, and progress states
- **Dynamic Upload Area**: Hides upload area when image is loaded to maximize workspace
- **Global Drag Support**: Drop images anywhere on the page, not just the upload area

### Advanced UI Features

- **Live Value Display**: Sliders show current values in real-time (quality percentages, offsets)
- **Conditional Form Sections**: Settings appear/hide based on format and shape selections
- **Visual Tag System**: Each size configuration shows comprehensive visual tags for all settings
- **Contrast-Aware Colors**: Background color tags automatically adjust text color for readability
- **Emoji Icons**: Intuitive emoji-based icons throughout the interface (📁, ✏️, 📋, 🗑️, etc.)

### Configuration Management

- **Size List**: Visual list of all configured output sizes with detailed information tags
- **Drag & Drop Reordering**: Rearrange size configurations with visual feedback
- **Compact View**: Toggle between detailed and compact size displays (☰ button)
- **Quick Actions**: Edit (✏️), duplicate (📋), and delete (🗑️) size configurations
- **Visual Tags**: Each size shows format, crop mode, shape, quality, centering, and background color
- **Smart Color Tags**: Background color tags with automatic text contrast for readability

### Modal Editor

- **Comprehensive Settings**: All options organized in Basic Settings and Advanced Options sections
- **Dynamic Form Controls**: Format-specific settings appear/hide based on selected output format
- **Interactive Sliders**: Quality sliders with live value display for JPEG, WebP, PNG compression, and GIF colors
- **Centering Controls**: 9 preset positions plus custom percentage-based positioning with sliders
- **Form Validation**: Prevents invalid configurations with real-time feedback
- **Keyboard Support**: Standard form navigation and accessibility features

## Preview and Gallery Features

### Image Viewing

- **Original Preview**: View source image with dimensions and file size
- **Processed Gallery**: Grid display of all processed images
- **Lightbox Viewer**: Full-screen image viewing with zoom
- **Image Information**: Dimensions, file size, and format details

### Gallery Navigation

- **Grid Layout**: Responsive grid for processed images
- **Touch Support**: Swipe navigation on mobile devices
- **Zoom Controls**: Pinch and click to zoom
- **Keyboard Navigation**: Arrow keys for image browsing

## Configuration Persistence Features

### Settings Storage

- **Auto-Save**: Size configurations saved automatically
- **Preference Memory**: Remembers auto-process and view settings
- **Session Persistence**: Settings survive browser restarts
- **Local Storage**: No server required for settings

### Import/Export

- **Configuration Export**: Save all size settings to a JSON file with version tracking
- **Configuration Import**: Load previously saved settings with validation
- **Backup Capability**: Easy backup and restore of configurations
- **Sharing**: Share size configurations with others
- **Import Confirmation**: Safety prompt before replacing existing configurations
- **Error Handling**: Clear feedback for invalid or corrupted configuration files

## Convenience Features

### User Experience

- **Offline Operation**: Works without internet connection
- **No Registration**: No accounts or sign-ups required
- **Privacy Focused**: No images uploaded to external servers
- **Fast Processing**: Client-side processing for immediate results
- **GitHub Integration**: Direct link to project repository for updates and support

### Workflow Optimization

- **Quick Setup**: Default configurations (Tiny, Small, Medium, Large) for immediate use
- **One-Image, Multiple-Sizes**: Single upload for all outputs
- **Batch Operations**: Process and download everything at once
- **Error Recovery**: Graceful handling of processing failures with user-friendly messages
- **Success Feedback**: Visual confirmation with processed image count
- **Smart UI States**: Buttons and controls automatically enable/disable based on current state

## Accessibility Features

### Usability

- **Keyboard Navigation**: Full keyboard support throughout the interface
- **Screen Reader Support**: Proper labeling and ARIA attributes
- **High Contrast**: Clear visual distinction between elements
- **Mobile Friendly**: Touch-optimized interface for mobile devices

### File Handling

- **Multiple Input Methods**: Drag & drop or file browser
- **Clear Instructions**: Visual cues and helpful text
- **Error Messages**: User-friendly error descriptions
- **Progress Indicators**: Clear feedback during operations

This feature overview focuses on what users can accomplish with Avatar Resizer, emphasizing capabilities and user benefits rather than technical implementation details.
