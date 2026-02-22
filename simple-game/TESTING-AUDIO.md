# Audio System Testing Checklist

Complete testing guide for the enhanced audio system in Farkle Game.

## Automated Verification (Pre-Testing)

Run these commands before manual testing:

```bash
# Check syntax of new audio modules
node -c utils/bgm-manager.js
node -c utils/volume-panel.js

# Verify script references in HTML
grep -A 2 "sound-manager.js" index.html

# Verify BGM file exists
ls -lh 墙洞bgm_1.mp4
```

## Manual Testing Checklist

### 1. Background Music (BGM) Tests

#### Initial State
- [ ] Game loads without errors
- [ ] BGM auto-plays on load (check browser console for any errors)
- [ ] BGM loops seamlessly
- [ ] No console errors related to audio

#### BGM Controls
- [ ] Click volume icon (🔊) to open control panel
- [ ] BGM toggle switch is visible and functional
- [ ] BGM volume slider appears and works
- [ ] BGM stops when toggle is OFF
- [ ] BGM resumes when toggle is ON
- [ ] BGM volume slider adjusts volume smoothly (0-100%)
- [ ] BGM can be muted (volume = 0)

#### BGM Persistence
- [ ] Refresh page after changing BGM settings
- [ ] BGM ON/OFF state is remembered
- [ ] BGM volume level is remembered

### 2. Sound Effects (SFX) Tests

#### Roll Sound
- [ ] Click "Roll Dice" button
- [ ] Dice sound plays during roll animation
- [ ] Sound is clear and not too loud
- [ ] Multiple rapid rolls don't cause audio overlap issues

#### Selection Sound
- [ ] Click on a die to select/deselect
- [ ] Selection sound plays on each click
- [ ] Sound is distinct from roll sound
- [ ] Rapid selection clicks work correctly

#### Score Sound
- [ ] Score a combination (e.g., three 1s)
- [ ] Success sound plays when score is registered
- [ ] Sound is pleasant and indicates success

#### Farkle Sound
- [ ] Roll a farkle (no scoring dice)
- [ ] Farkle sound plays
- [ ] Sound is distinct and indicates failure

#### Turn Change Sound
- [ ] End turn and switch players
- [ ] Turn change sound plays
- [ ] Sound indicates transition clearly

### 3. UI/UX Tests

#### Volume Panel
- [ ] Volume icon (🔊) is visible in top-left corner
- [ ] Panel expands/collapses smoothly
- [ ] Panel doesn't interfere with gameplay
- [ ] Panel is responsive on different screen sizes

#### Controls
- [ ] All toggles and sliders are easy to click/tap
- [ ] Visual feedback when adjusting controls
- [ ] Labels are clear (Chinese labels for BGM/SFX)
- [ ] Icons are appropriate and clear

#### Styling
- [ ] Panel looks integrated with game design
- [ ] Colors match game theme
- [ ] No z-index conflicts with other UI elements
- [ ] Panel is visible against game background

### 4. Settings Persistence Tests

#### Local Storage
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Verify keys exist:
  - `farkle_bgmEnabled` (boolean)
  - `farkle_bgmVolume` (number)
  - `farkle_sfxEnabled` (boolean)
  - `farkle_sfxVolume` (number)

#### Persistence After Refresh
- [ ] Change all settings
- [ ] Refresh page (F5 or Cmd+R)
- [ ] All settings are restored
- [ ] BGM resumes with saved volume
- [ ] All toggles match saved state

#### Persistence Across Sessions
- [ ] Change settings
- [ ] Close browser completely
- [ ] Reopen browser and game
- [ ] All settings are preserved

### 5. Browser Compatibility Tests

Test in the following browsers:

#### Desktop Browsers
- [ ] **Chrome/Edge** (latest version)
  - BGM plays
  - SFX plays
  - Controls work
  - Persistence works

- [ ] **Firefox** (latest version)
  - BGM plays (may need interaction first)
  - SFX plays
  - Controls work
  - Persistence works

- [ ] **Safari** (latest version)
  - BGM plays
  - SFX plays
  - Controls work
  - Persistence works

#### Mobile Browsers (if applicable)
- [ ] **Mobile Safari** (iOS)
  - Touch controls work
  - Audio plays (may need initial tap)
  - Panel is usable on small screen

- [ ] **Chrome Mobile** (Android)
  - Touch controls work
  - Audio plays
  - Panel is usable on small screen

### 6. Performance Tests

#### Loading Time
- [ ] BGM file loads reasonably fast (< 3 seconds on good connection)
- [ ] Page doesn't hang while loading audio
- [ ] Game remains responsive during audio playback

#### Memory
- [ ] Monitor memory usage in DevTools
- [ ] No memory leaks during extended play
- [ ] Memory usage is stable over time

#### CPU Usage
- [ ] Audio doesn't cause excessive CPU usage
- [ ] Game remains smooth with audio enabled

### 7. Edge Cases

#### Audio File Issues
- [ ] Delete BGM file (墙洞bgm_1.mp4)
- [ ] Game still works without BGM
- [ ] No crashes or errors
- [ ] Restore BGM file and verify it plays again

#### Rapid Interactions
- [ ] Rapidly click roll button
- [ ] Rapidly toggle BGM on/off
- [ ] Rapidly adjust volume sliders
- [ ] No audio glitches or errors

#### Zero Volume
- [ ] Set both volumes to 0
- [ ] No audio plays
- [ ] Sliders still work when adjusted back up

#### Concurrent Audio
- [ ] Play music in another tab
- [ ] Game audio mixes correctly
- [ ] Volume controls affect only game audio

### 8. User Acceptance Criteria

#### Core Functionality
- [ ] BGM plays automatically on game load
- [ ] SFX play at appropriate game events
- [ ] Volume controls work independently for BGM and SFX
- [ ] Settings are saved and restored

#### User Experience
- [ ] Controls are intuitive and easy to find
- [ ] Audio enhances gameplay without being distracting
- [ ] Volume levels are appropriate by default
- [ ] Users can fully disable audio if desired

#### Technical Quality
- [ ] No console errors related to audio
- [ ] Works across major browsers
- [ ] Performance is not impacted
- [ ] Code is maintainable and well-documented

## Test Results Template

Use this format to report test results:

```markdown
### Test Session: [Date]

**Tester**: [Name]
**Browser**: [Browser Name + Version]
**OS**: [Operating System]

#### Results

**BGM Tests**: [PASS/FAIL/PARTIAL]
- Notes: [Any issues found]

**SFX Tests**: [PASS/FAIL/PARTIAL]
- Notes: [Any issues found]

**Persistence Tests**: [PASS/FAIL/PARTIAL]
- Notes: [Any issues found]

**Browser Compatibility**: [PASS/FAIL/PARTIAL]
- Notes: [Any issues found]

**Overall Status**: [PASS/FAIL/PARTIAL]

#### Issues Found

1. [Issue description]
   - Severity: [Critical/Major/Minor]
   - Steps to reproduce: [Details]
   - Expected behavior: [Details]
   - Actual behavior: [Details]

#### Recommendations

[Any suggestions for improvements]
```

## Quick Smoke Test

For quick verification, run these essential tests:

1. [ ] Game loads without errors
2. [ ] BGM auto-plays
3. [ ] Roll dice - hear sound
4. [ ] Adjust BGM volume - works
5. [ ] Toggle BGM off/on - works
6. [ ] Adjust SFX volume - works
7. [ ] Refresh page - settings saved
8. [ ] No console errors

If all smoke tests pass, the audio system is ready for production.
