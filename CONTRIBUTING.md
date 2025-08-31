# 🤝 Contributing to DocForge

Thank you for your interest in contributing to DocForge! We welcome contributions from developers, technical writers, designers, and documentation enthusiasts.

## 🌟 Ways to Contribute

### 🐛 **Bug Reports**
- Use GitHub Issues with the `bug` label
- Include steps to reproduce, expected vs actual behavior
- Provide environment details (OS, Node.js version, browser)

### ✨ **Feature Requests**
- Use GitHub Issues with the `enhancement` label
- Describe the problem you're solving
- Include mockups or examples if applicable

### 📝 **Documentation**
- Improve existing documentation
- Add examples and tutorials
- Fix typos and clarify instructions

### 💻 **Code Contributions**
- Bug fixes and performance improvements
- New features and components
- MCP tool development
- Test coverage improvements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+ (local or cloud)
- Git and GitHub account
- Code editor (VS Code recommended)

### Development Setup

1. **Fork and Clone**
```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/docforge.git
cd docforge
```

2. **Install Dependencies**
```bash
# Install all dependencies
npm install

# Install MCP server dependencies
cd mcp-server && npm install && cd ..
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
MONGODB_URI=mongodb://localhost:27017/docforge
JWT_SECRET=your-secret-key
API_PORT=3001
```

4. **Start Development Servers**
```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start API server
npm run api

# Terminal 3: Start frontend
npm run dev

# Terminal 4: Test MCP server
npm run mcp
```

## 📋 Development Guidelines

### Code Style
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Use Prettier for code formatting
- **Naming**: Use camelCase for variables, PascalCase for components
- **Comments**: Add JSDoc comments for functions and components

### Component Structure
```javascript
// Good component structure
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 */
function MyComponent({ title, onAction }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  return (
    <div className="my-component">
      <h2>{title}</h2>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func
};

export default MyComponent;
```

### API Development
```javascript
// Good API endpoint structure
const express = require('express');
const router = express.Router();

/**
 * GET /api/pages
 * Retrieve all pages for a tenant
 */
router.get('/pages', verifyApiKey, async (req, res) => {
  try {
    const pages = await Page.find({ tenantId: req.tenant._id });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### MCP Tool Development
```javascript
// Good MCP tool structure
async function createPage(args) {
  try {
    // Validate arguments
    if (!args.title || !args.content) {
      throw new Error('Title and content are required');
    }

    // API call
    const response = await fetch(`${API_BASE}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': args.apiKey
      },
      body: JSON.stringify(args)
    });

    // Return structured response
    return {
      content: [{
        type: "text",
        text: `✅ Page "${args.title}" created successfully!`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text", 
        text: `❌ Error: ${error.message}`
      }]
    };
  }
}
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
```javascript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders title correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<MyComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

## 📦 Pull Request Process

### Before Submitting
1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
- Write clean, documented code
- Add tests for new functionality
- Update documentation if needed

3. **Test Everything**
```bash
npm test
npm run lint
npm run build
```

4. **Commit Changes**
```bash
git add .
git commit -m "feat: add amazing new feature

- Detailed description of changes
- Why this change is needed
- Any breaking changes"
```

### Pull Request Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings or errors
```

## 🏷️ Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat: add smart template generation
fix: resolve MCP server connection issue
docs: update API documentation
style: fix linting errors
refactor: improve component structure
test: add unit tests for quality checker
chore: update dependencies
```

### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🎯 Areas for Contribution

### 🔥 **High Priority**
- Performance optimizations
- Mobile responsiveness improvements
- Accessibility enhancements
- Test coverage expansion

### 🚀 **New Features**
- Real-time collaborative editing
- Advanced search filters
- Integration with external tools
- Custom MCP tools

### 📚 **Documentation**
- API documentation improvements
- Tutorial creation
- Example projects
- Video guides

### 🎨 **Design**
- UI/UX improvements
- Dark mode implementation
- Component library expansion
- Accessibility audits

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributor graphs
- Special mentions in blog posts

## 📞 Getting Help

### Communication Channels
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time chat (coming soon)
- **Email**: maintainers@docforge.dev

### Mentorship
New contributors can request mentorship for:
- First-time contributions
- Complex feature development
- Architecture discussions
- Best practices guidance

## 📜 Code of Conduct

### Our Pledge
We pledge to make participation in DocForge a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to maintainers@docforge.dev. All complaints will be reviewed and investigated promptly and fairly.

---

## 🙏 Thank You

Every contribution, no matter how small, helps make DocForge better for everyone. Whether you're fixing a typo, adding a feature, or helping other users, you're part of building something amazing.

**Happy Contributing! 🚀**

*Let's forge better documentation together.*
