---
inclusion: always
---

# Minimal Implementation Guidelines

## Philosophy

This project follows a "minimal but complete" philosophy. Every line of code should serve a clear purpose. Avoid over-engineering, premature abstractions, and unnecessary dependencies.

## Tone and Constraints

### Code Style

- **Clarity over cleverness**: Write code that's easy to understand
- **Direct over abstract**: Prefer straightforward implementations
- **Native over external**: Use language/framework built-ins when possible
- **Simple over complex**: Choose the simplest solution that works

### Dependency Management

- **Minimize dependencies**: Only add libraries that provide significant value
- **Justify additions**: Document why each dependency is necessary
- **Prefer standards**: Use well-established, maintained libraries
- **Avoid bloat**: Don't add dependencies for single-use utilities

### Architecture

- **Flat over nested**: Avoid deep folder hierarchies
- **Explicit over implicit**: Make behavior obvious
- **Separation of concerns**: Keep models, routes, and services distinct
- **Extension points**: Provide clear patterns for adding features

### Implementation Rules

1. **No premature optimization**: Focus on correctness first
2. **No speculative features**: Only implement what's needed now
3. **No complex patterns**: Avoid factories, builders, strategies unless truly needed
4. **No heavy frameworks**: Stick to FastAPI, React, and minimal tooling

### Testing

- **Test behavior, not implementation**: Focus on what code does, not how
- **Property-based tests for logic**: Use Hypothesis/fast-check for core algorithms
- **Unit tests for integration**: Test component boundaries
- **Minimal mocking**: Prefer real implementations in tests

### Documentation

- **Code should be self-documenting**: Use clear names and structure
- **Comments explain why, not what**: Document decisions, not syntax
- **README for setup**: Keep getting-started instructions simple
- **Specs for design**: Use .kiro/specs for detailed documentation

## Extension Guidelines

When adding new features:

1. **Follow existing patterns**: Look at similar code first
2. **Keep it minimal**: Implement only what's required
3. **Update specs**: Document new features in requirements/design
4. **Add tests**: Include property tests for core logic

## Anti-Patterns to Avoid

- ❌ Adding ORMs on top of ORMs
- ❌ Complex middleware chains
- ❌ Deep inheritance hierarchies
- ❌ Overly generic abstractions
- ❌ Configuration for everything
- ❌ Microservices for a starter kit
- ❌ Heavy state management libraries
- ❌ CSS frameworks when CSS is sufficient

## What "Minimal" Means

Minimal doesn't mean incomplete or poorly structured. It means:

- ✅ Every feature has a clear purpose
- ✅ Code is easy to understand and modify
- ✅ Dependencies are justified and documented
- ✅ Architecture supports growth without rewriting
- ✅ Tests validate correctness without over-testing
- ✅ Documentation explains decisions, not syntax

## When to Break These Rules

These guidelines aren't absolute. Break them when:

- Security requires additional complexity
- Performance demands optimization
- Scale necessitates architectural changes
- User needs justify additional features

But always document why you're breaking the rules.
