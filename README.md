# Gestão Inteligente — Obra Nova

Sistema de gestão de obras (orçamentos, RDO, almoxarifado, financeiro, engenharia,
suprimentos, medições, RH e SST) rodando 100% no navegador, sem backend — os dados
ficam salvos em `localStorage`.

## Como rodar

Basta abrir o [index.html](index.html) diretamente no navegador (duplo clique ou
`file://`). Não precisa de servidor, build ou instalação de dependências.

Login inicial: usuário `admin`, senha `admin123`.

## Estrutura do projeto

```
index.html                     Marcação da página e todas as telas estáticas
css/styles.css                 Estilos (tema claro/escuro, layout, componentes)
data/sinapi-composicoes.js     Base de composições SINAPI (~61 mil itens)
js/01-core.js                  Núcleo: estado, cadastro, orçamentos, almoxarifado, financeiro
js/02-rdo.js                   Módulo de RDO (Relatório Diário de Obra) e geração de PDF
js/03-auth.js                  Login, usuários e permissões por menu
js/04-sections-builder.js      Montagem das telas do menu estendido
js/05-linked-modules.js        Concretagem, suprimentos, medições, RH, SST, kanbans etc.
```

## Origem

Este projeto foi extraído e reorganizado a partir de um protótipo single-file
(`index.html.html`) em módulos separados, para poder ser versionado no Git e
editado de forma organizada no VSCode.
