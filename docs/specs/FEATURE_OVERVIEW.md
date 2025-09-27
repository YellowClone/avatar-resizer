
# Avatar Resizer - Feature Overview

## Core Functionality

**Avatar Resizer** is a browser-based image resizing tool that transforms a single source image into multiple target sizes simultaneously. All processing happens client-side in the browser - no server uploads or internet connectivity are required.

## Image Input Features

### Upload Methods

- **Drag & Drop**: Drop images anywhere on the page for instant upload with a global drag overlay
- **File Browser**: Click to select files from your device
- **Image Preview**: Display the currently selected image with file metadata (dimensions, file size, format)
- **Multiple Images**: Load and manage multiple images simultaneously
  - **Image Gallery**: Thumbnail preview of all loaded images with click-to-switch preview functionality
  - **Active Image Indicator**: Visual highlighting of the currently selected image in the gallery
  - **Individual Removal**: Remove specific images from the batch using a close button on each thumbnail
  - **Upload Area Auto-Hide**: The upload area hides automatically once images are present and the main preview is shown
  - **Batch Processing**: Process all loaded images with the configured output sizes in one operation

### Supported Input Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- AVIF (.avif)

## Size Configuration Features

Size configurations define how the source image is transformed into each target size. Multiple configurations can be created, edited, duplicated, reordered, exported/imported and deleted.

### Target Dimensions

- **Custom Sizes**: Set any width and height in pixels
- **Zero-Value Handling**: A zero for width or height (e.g., 200x0) will auto-calculate the missing dimension when "maintain aspect ratio" is enabled
- **Aspect Ratio Control**: Toggle to maintain or ignore the original image aspect ratio
- **Default Presets**: Tiny (100×100), Small (200×200), Medium (400×400), Large (800×800)
- **Multiple Outputs**: Create as many target sizes as needed

### Crop Modes

- **Fit**: Maintain aspect ratio and letterbox/pillarbox the remaining space (background color or transparency used as needed)
- **Fill**: Crop to exactly fill the target dimensions (uses centering offsets)
- **Stretch**: Resize to exact target dimensions without preserving aspect ratio

### Aligning and Centering

- **Preset Options**: Top-Left, Top-Center, Top-Right, Center-Left, Center (default), Center-Right, Bottom-Left, Bottom-Center, Bottom-Right
- **Custom Offsets**: Horizontal and vertical offsets expressed as percentages (0–100)

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
- **ICO**: Windows icon format

### Format-Specific Controls

- **JPEG Quality**: Adjustable from 10-100% in 5% increments
- **WebP Quality**: Adjustable from 10-100% in 5% increments

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
- **Transparency**: Optional transparent backgrounds for PNG, WebP, and ICO formats
- **Smart Background Handling**: Automatic background application for formats that don't support transparency (JPEG)
- **Shape-Aware Background**: Background color used for letterboxing in Fit mode and shaped outputs when transparency is disabled

## File Naming Features

### Filename Patterns

Customizable filename templates using placeholders:

- `{original_name}` — Original filename without extension
- `{original_ext}` — Original file extension (e.g., `png`, `jpg`)
- `{original_format}` — Original image format (e.g., `PNG`, `JPEG`)
- `{original_width}` — Original image width in pixels
- `{original_height}` — Original image height in pixels
- `{name}` — Size configuration name
- `{width}` — Target width in pixels
- `{height}` — Target height in pixels
- `{crop_mode}` — Crop mode used (`Fit`, `Fill`, `Stretch`)
- `{resize_quality}` — Resize algorithm used (`High`, `Medium`, `Low`, `Fastest`)
- `{format}` — Output format name (e.g., `PNG`, `JPEG`, `WebP`)
- `{format_ext}` — Output file extension (e.g., `png`, `jpg`, `webp`)
- `{format_quality}` — Format-specific quality setting (e.g., `85%`)
- `{shape}` — Output shape (`Rectangle`, `Circle`, `Rounded`)
- `{centering}` — Centering preset used (e.g., `Center`, `Top-Left`)
- `{background}` — Background color (hex code without #, or `transparent`)
- `{maintain_aspect_ratio}` — Aspect ratio setting (`Maintain` or `Ignore`)
- `{date}` — Processing date (ISO `YYYY-MM-DD`)
- `{time}` — Processing time (`HHMMSS`)
- `{timestamp}` — Unix timestamp (seconds since epoch)

### Formatting Support

Template placeholders support basic formatting options:

- **Zero-padding for numbers**: Add digits after colon for padding (e.g., `{width:4}` → `0200`)
- **Case transformation for text**: Use `upper` or `lower` (e.g., `{format:upper}` → `PNG`, `{format:lower}` → `png`)
- **Date/time formatting**: Use format strings (e.g., `{timestamp:"YYYY-MM-DD HH:mm:ss"}` → `2024-01-15 14:30:25`)

### Example Patterns

- `{original_name}_{width}x{height}.{format_ext}` → `avatar_200x200.png` (default)
- `{original_name}_{width:4}x{height:4}_{format:lower}.{format_ext}` → `avatar_0200x0200_png.png`
- `{name}_{format}_{timestamp}.{format_ext}` → `Small_PNG_1696518645.png`
- `{original_name}_{shape}_{format_quality}_{date}.{format_ext}` → `avatar_Circle_85%_2024-01-15.png`
- `{original_name}_{timestamp:"YYYY-MM-DD_HH-mm-ss"}.{format_ext}` → `avatar_2024-01-15_14-30-25.png`
- `{name}_{shape:upper}_{time}_{width}x{height}.{format_ext}` → `SMALL_CIRCLE_143025_200x200.png`

## Processing Features

### Batch Processing

- **One-Click Processing**: Process all configured sizes simultaneously
- **Auto-Processing**: Optional automatic processing when images are uploaded
- **Progress Feedback**: Visual indicators during processing
- **Error Handling**: Clear messages for processing failures
- **Multi-Image Support**: Process multiple loaded images with individual results

### Processing Control

- **Manual Trigger**: Process button for on-demand processing
- **Auto-Process Toggle**: Enable/disable automatic processing when images are uploaded
- **Individual Control**: Edit each size configuration independently
- **Smart Button States**: Process button automatically enables/disables based on image and configuration availability
- **Dynamic Status Messages**: Real-time feedback about current application state
- **Error Recovery**: Graceful handling of processing failures with user-friendly messages
- **Performance Optimization**: Canvas reuse and async batch processing for efficient multi-image handling
- **Processing State Management**: Prevents concurrent operations and provides visual feedback during batch processing
- **Prevent Concurrent Operations**: Processing pipeline does not start if another operation is in progress
- **Success Feedback**: Visual confirmation with processed image count

## Download Features

### Download Options

- **Individual Downloads**: Download specific processed images
- **Bulk Download**: Download all images as a ZIP file
- **ICO Multi-Resolution**: Download all sizes as a single multi-resolution ICO file for Windows icons
- **Instant Access**: No waiting for server processing

### File Organization

- **Organized Naming**: Consistent filename patterns
- **ZIP Packaging**: All images bundled for easy distribution
- **ICO Packaging**: Multiple icon sizes in single Windows icon file
- **Packaging File Names**: Packaged ZIP and ICO file named `avatar-resizer-YYYYMMDDhhmmss.{ext}` (e.g., `avatar-resizer-20240115T143025.zip`)

## User Interface Features

### Layout and Design

- **Two-Column Layout**: Upload area and configuration sidebar with CSS Grid
- **Responsive Design**: Automatically adapts to desktop, tablet, and mobile devices
- **Clean Interface**: Minimal, focused design with modern styling
- **Visual Feedback**: Clear status indicators, success messages, and progress states
- **Dynamic Upload Area**: Hides upload area when image is loaded to maximize workspace
- **Global Drag Support**: Drop images anywhere on the page, not just the upload area
- **Message Notifications**: Auto-dismissing popup messages for success, error, and info feedback
- **Touch Optimization**: Swipe navigation and touch-friendly controls for mobile devices

### Advanced UI Features

- **Live Value Display**: Sliders show current values in real-time (quality percentages, offsets)
- **Conditional Form Sections**: Settings appear/hide based on format and shape selections
- **Visual Tag System**: Each size configuration shows comprehensive visual tags for all settings
- **Contrast-Aware Colors**: Background color tags automatically adjust text color for readability
- **Emoji Icons**: Intuitive emoji-based icons throughout the interface (📁, ✏️, 📋, 🗑️, etc.)
- **Compact View Toggle**: Switch between detailed and compact size configuration displays
- **Drag & Drop Reordering**: Rearrange size configurations with visual feedback
- **Smart Button States**: Buttons automatically enable/disable based on current context
- **Theme Switching**: Toggle between light and dark themes with automatic preference saving

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
- **Interactive Sliders**: Quality sliders with live value display for JPEG and WebP quality settings
- **Centering Controls**: 9 preset positions plus custom percentage-based positioning with sliders
- **Form Validation**: Prevents invalid configurations with real-time feedback
- **Keyboard Support**: Standard form navigation and accessibility features

## Preview and Gallery Features

### Image Viewing

- **Original Preview**: View source image with dimensions and file size
- **Multiple Image Carousel**: Navigate between loaded images with thumbnail previews
- **Processed Gallery**: Grid display of all processed images
- **Lightbox Viewer**: Full-screen image viewing with zoom and navigation
- **Image Information**: Dimensions, file size, and format details for all images

### Gallery Navigation

- **Grid Layout**: Responsive grid for processed images
- **Touch Support**: Swipe navigation on mobile devices
- **Zoom Controls**: Pinch and click to zoom in lightbox
- **Keyboard Navigation**: Arrow keys for image browsing
- **Download Integration**: Direct download buttons in lightbox view

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
- **Version Compatibility**: Configuration files include version information for future compatibility

## Convenience Features

### User Experience

- **Offline Operation**: Works without internet connection
- **No Registration**: No accounts or sign-ups required
- **Privacy Focused**: No images uploaded to external servers
- **Fast Processing**: Client-side processing for immediate results
- **GitHub Integration**: Direct link to project repository for updates and support
- **Message Notifications**: Real-time success and error feedback with auto-dismissing popups

### Workflow Optimization

- **Quick Setup**: Default configurations (Tiny, Small, Medium, Large) for immediate use
- **One-Image, Multiple-Sizes**: Single upload for all outputs
- **Batch Operations**: Process and download everything at once
- **Error Recovery**: Graceful handling of processing failures with user-friendly messages
- **Success Feedback**: Visual confirmation with processed image count
- **Smart UI States**: Buttons and controls automatically enable/disable based on current state
- **Multiple Image Management**: Load, switch between, and remove individual images as needed
- **Memory Management**: Automatic cleanup of object URLs and canvas resources for optimal performance
- **Browser Compatibility**: Special handling for different browser capabilities (e.g., Firefox ICO support)

## Accessibility Features

### Usability

- **Keyboard Navigation**: Full keyboard support throughout the interface
- **Screen Reader Support**: Proper labeling and ARIA attributes
- **High Contrast**: Clear visual distinction between elements
- **Mobile Friendly**: Touch-optimized interface for mobile devices
- **Smart Feedback**: Context-aware button states and status messages
- **Error Announcements**: Accessible error messages and notifications

### File Handling

- **Multiple Input Methods**: Drag & drop or file browser
- **Clear Instructions**: Visual cues and helpful text
- **Error Messages**: User-friendly error descriptions
- **Progress Indicators**: Clear feedback during operations
- **File Management**: Easy switching between multiple loaded images

This feature overview focuses on what users can accomplish with Avatar Resizer, emphasizing capabilities and user benefits rather than technical implementation details.

