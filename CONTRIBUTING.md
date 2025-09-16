# Guia de Contribuição

Este documento define as práticas recomendadas para contribuir de forma consistente e organizada.

---

## 🌿 Nomeação de Branch

Use sempre o formato: `tipo/nome-descritivo`

### Tipos comuns:
- `feature/` → nova funcionalidade
- `bugfix/` → correção de bug
- `hotfix/` → correção urgente em produção
- `docs/` → documentação
- `chore/` → manutenção ou ajustes técnicos

### Exemplos:

```
feature/countries-scale
bugfix/fix-card-dimension
docs/add-contributing-guide
```

---

## 📝 Commits

Adotamos o padrão **Conventional Commits**: `tipo(escopo opcional): descrição curta no imperativo`

### Tipos comuns:
- `feat` → nova funcionalidade
- `fix` → correção de bug
- `docs` → mudanças em documentação
- `style` → formatação (sem alteração de lógica)
- `refactor` → refatoração de código
- `test` → criação/alteração de testes
- `chore` → tarefas diversas

### Exemplos:

```
feat(map): add scale adjustment for countries
fix(ui): correct card dimension rendering
docs(contributing): add contributing guidelines
refactor(user-service): simplify validation logic
```

---

## 🔀 Pull Requests

O título da PR deve ser **curto e descritivo**.  
Recomenda-se seguir o padrão: `[Tipo] Descrição clara`

### Exemplos:

```
[Feature] Add scale adjustment for countries
[Fix] Correct card dimension rendering
[Docs] Add contributing guidelines
```

---

## ✅ Resumindo

- **Branch:** `tipo/nome-descritivo`
- **Commit:** `tipo(escopo): descrição curta`
- **PR:** `[Tipo] Descrição clara`
