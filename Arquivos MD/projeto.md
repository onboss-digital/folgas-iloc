# Documento de requisitos — Sistema Web de Gestão de Folgas 5x2

Especificação para DEV

Mobile First

Google Stitch

A proposta é desenvolver um sistema web próprio, com banco de dados independente, interface simples e responsiva, voltado inicialmente para uma equipe de quatro funcionários.

O sistema deverá permitir organizar, distribuir, visualizar e controlar as folgas da equipe, seguindo o modelo de escala 5x2.

Vou estruturar o projeto como um documento de requisitos que você poderá entregar diretamente ao desenvolvedor, além de um prompt completo para criar as telas no Google Stitch.

# PARTE 1 — VISÃO GERAL DO PRODUTO

## 1. Objetivo do sistema

Desenvolver uma plataforma web para gerenciamento de escalas de trabalho e folgas dos funcionários.

O administrador deverá conseguir:

1. Cadastrar os funcionários.
2. Definir os dias de funcionamento da empresa.
3. Definir quantas pessoas precisam trabalhar por dia.
4. Gerar escalas automaticamente.
5. Alterar manualmente as folgas.
6. Visualizar a escala semanal e mensal.
7. Identificar dias com equipe insuficiente.
8. Acompanhar o histórico das escalas.
9. Exportar os dados para Excel ou Google Sheets.
10. Fazer backup e restaurar informações.

Premissa principal: o sistema deve facilitar a gestão, e não criar mais trabalho administrativo.

## 2. Perfil de utilização

Inicialmente, o sistema terá dois tipos de usuários:

| Perfil        | Permissões                                             |
| ------------- | ------------------------------------------------------ |
| Administrador | Acesso completo ao sistema                             |
| Gerente       | Visualização e edição das escalas, conforme permissões |

Os funcionários não precisam ter login na primeira versão. Isso reduz a complexidade e o custo de desenvolvimento.

O sistema deverá funcionar em:

- Computador.
- Tablet.
- Celular Android.
- iPhone.

## 3. Estrutura de navegação

Recomendo trabalhar com cinco módulos principais:

Dashboard

Visão geral da operação e indicadores.

Escalas

Criação, edição e gerenciamento das folgas.

Funcionários

Cadastro e gerenciamento da equipe.

Relatórios

Indicadores, histórico e produtividade da escala.

Configurações

Regras de escala, usuários e backups.

# PARTE 2 — FUNCIONALIDADES DETALHADAS

## 4. Dashboard — Tela inicial

Essa será a primeira tela depois do login.

O objetivo é que o administrador abra o sistema e consiga entender rapidamente a situação da equipe.

### Indicadores principais

- Total de funcionários ativos.
- Quantidade de pessoas trabalhando hoje.
- Quantidade de pessoas de folga hoje.
- Próximas folgas.
- Alertas de cobertura.
- Situação da escala semanal.

### Exemplo de apresentação

Painel de controle

QUINTA-FEIRA · VISÃO ILUSTRATIVA

Equipe ativa

# 04

Trabalhando hoje

# 03

De folga hoje

# 01

Alertas

# 00

Quem está de folga hoje?

João

Folga

Próximas folgas

Pedro

Sexta e sábado

Carlos

Domingo e segunda

### Regras do Dashboard

- Atualizar os indicadores automaticamente.
- Considerar a data atual.
- Exibir alertas quando a quantidade de funcionários disponíveis for inferior ao mínimo configurado.
- Permitir clicar nos indicadores para abrir os detalhes.

## 5. Cadastro de funcionários

Tela para cadastrar e gerenciar os funcionários.

### Informações necessárias

| Campo                       | Tipo             |
| --------------------------- | ---------------- |
| Nome completo               | Texto            |
| Cargo                       | Texto            |
| Data de admissão            | Data             |
| Status                      | Ativo/Inativo    |
| Dias de folga preferenciais | Seleção opcional |
| Observações                 | Texto opcional   |

### Funcionalidades

- Adicionar funcionário.
- Editar cadastro.
- Desativar funcionário.
- Consultar histórico de escalas.
- Definir preferências de folga.
- Definir restrições de disponibilidade.

Importante: desativar um funcionário não deve apagar o histórico dele.

## 6. Tela de escalas

Módulo mais importante

Essa será a principal funcionalidade do sistema.

O administrador deverá conseguir visualizar a escala por semana ou por mês.

### Visualização semanal

A tela deverá apresentar:

- Nome dos funcionários na primeira coluna.
- Dias da semana nas colunas seguintes.
- Status de trabalho ou folga.
- Total de pessoas trabalhando em cada dia.
- Alertas de cobertura.

Cada célula deverá ser clicável.

Ao clicar em uma célula, abrir um pequeno menu com:

- Trabalhando.
- Folga.
- Férias.
- Afastamento.
- Outro tipo de indisponibilidade.

A alteração deverá atualizar os indicadores automaticamente.

### Visualização mensal

O calendário deverá apresentar os dias do mês e identificar visualmente:

- Dias com cobertura normal.
- Dias com equipe reduzida.
- Dias com cobertura insuficiente.
- Folgas programadas.

O usuário poderá selecionar um dia e visualizar quais funcionários estarão trabalhando ou de folga.

### Ações principais

Na parte superior da tela:

1. Botão "Nova escala".
2. Botão "Gerar automaticamente".
3. Botão "Salvar alterações".
4. Botão "Publicar escala".
5. Seletor de semana/mês.

### Status da escala

Cada escala deverá ter três estados:

| Status    | Significado                                |
| --------- | ------------------------------------------ |
| Rascunho  | Ainda está sendo preparada                 |
| Publicada | Escala oficial para consulta               |
| Arquivada | Escala encerrada e preservada no histórico |

Uma escala publicada não deve ser modificada silenciosamente. Alterações deverão gerar registro de histórico.

## 7. Gerador automático de escalas

Essa funcionalidade é muito importante.

O sistema deverá conseguir gerar uma escala de acordo com as regras cadastradas pelo administrador.

### Parâmetros de geração

- Quantidade de funcionários.
- Dias de funcionamento.
- Quantidade mínima de funcionários por dia.
- Quantidade de folgas por funcionário.
- Preferências de folga.
- Dias que precisam de maior cobertura.
- Rodízio de finais de semana.
- Período da escala.

### Como deverá funcionar

1. Administrador escolhe o período.
2. Clica em "Gerar escala".
3. Sistema calcula a distribuição.
4. Sistema apresenta uma prévia.
5. Sistema verifica conflitos.
6. Administrador aprova ou ajusta manualmente.
7. Administrador publica.

Importante: o gerador nunca deverá publicar automaticamente uma escala com conflitos sem avisar o administrador.

### Regras de distribuição

O algoritmo deverá priorizar:

1. Garantir a quantidade mínima de funcionários trabalhando.
2. Garantir os dias de descanso previstos para cada funcionário.
3. Distribuir as folgas de maneira equilibrada.
4. Evitar que a mesma pessoa fique sempre com os mesmos dias.
5. Alternar finais de semana, quando aplicável.
6. Respeitar preferências e restrições cadastradas.
7. Evitar sequências excessivas de dias trabalhados.
8. Considerar as regras de jornada e descanso configuradas para a empresa.

### Uma observação matemática importante

Com quatro funcionários trabalhando cinco dias por semana, existem 20 jornadas individuais disponíveis por semana.

Se a empresa funcionar sete dias:

- Seis dias podem ter três pessoas trabalhando.
- Um dia terá duas pessoas trabalhando.

Isso significa que não é possível manter três pessoas todos os sete dias sem reforço de equipe, redução dos dias de funcionamento ou outra organização de jornada.

O sistema precisa validar essa capacidade antes de gerar a escala.

## 8. Calendário de folgas

Criar uma tela de calendário mensal.

O administrador deverá poder:

- Navegar entre os meses.
- Consultar folgas de cada funcionário.
- Filtrar por funcionário.
- Identificar os dias mais críticos.
- Clicar em qualquer dia para consultar a equipe.
- Alterar uma folga diretamente pelo calendário.

A navegação deverá ser simples, especialmente no celular.

## 9. Relatórios

Criar relatórios simples, sem excesso de indicadores.

### Relatório individual

- Nome do funcionário.
- Dias trabalhados no período.
- Quantidade de folgas.
- Domingos de folga.
- Férias e afastamentos registrados.
- Histórico mensal.

### Relatório geral

- Cobertura por dia.
- Quantidade de funcionários trabalhando.
- Quantidade de funcionários de folga.
- Dias com equipe reduzida.
- Dias com problemas de cobertura.
- Histórico de escalas.

Permitir exportação em Excel e CSV.

## 10. Configurações

O administrador deverá conseguir configurar as regras da empresa sem precisar alterar o código.

### Configurações gerais

| Configuração              | Exemplo inicial   |
| ------------------------- | ----------------- |
| Regime de escala          | 5x2               |
| Funcionamento             | 7 dias            |
| Funcionários ativos       | 4                 |
| Descansos semanais        | 2 por funcionário |
| Mínimo de pessoas por dia | 2                 |
| Rodízio de folgas         | Ativado           |
| Rodízio de domingos       | Ativado           |
| Início da semana          | Segunda-feira     |

Todos esses valores devem ser editáveis.

Também é necessário permitir configurar os horários de trabalho, a carga horária semanal, intervalos e regras de descanso aplicáveis à empresa.

As regras trabalhistas não devem ser fixadas apenas pelo desenvolvedor. Devem ser parametrizadas e validadas conforme a legislação vigente, a atividade e a convenção coletiva aplicável.

# PARTE 3 — REGRAS DE NEGÓCIO

## 11. Regras que o desenvolvedor deverá implementar

Estas são as regras essenciais do sistema.

| Código | Regra                                                               |
| ------ | ------------------------------------------------------------------- |
| RN01   | Funcionário inativo não entra em novas escalas                      |
| RN02   | Cada funcionário deve cumprir a quantidade de descansos configurada |
| RN03   | Não permitir cobertura inferior ao mínimo sem alerta                |
| RN04   | Alterações manuais devem atualizar os indicadores                   |
| RN05   | Escalas publicadas devem manter histórico                           |
| RN06   | Não permitir publicação com conflitos não resolvidos                |
| RN07   | Gerador automático deve considerar as preferências                  |
| RN08   | O rodízio deve distribuir as folgas de forma equilibrada            |
| RN09   | Férias e afastamentos devem ser considerados na disponibilidade     |
| RN10   | Toda alteração deve registrar usuário, data e horário               |
| RN11   | Não apagar o histórico de funcionários desligados                   |
| RN12   | Impedir que duas escalas publicadas se sobreponham                  |

### Regra adicional importante

O sistema deve distinguir:

- Folga semanal.
- Férias.
- Afastamento.
- Indisponibilidade excepcional.

Essas situações não podem ser contabilizadas como se fossem a mesma coisa.

# PARTE 4 — ESTRUTURA TÉCNICA PARA O DEV

## 12. Banco de dados

Minha recomendação é utilizar o Supabase (PostgreSQL).

Ele permite armazenar os dados, autenticar usuários e manter o sistema acessível pela internet.

Não recomendo utilizar o Google Sheets como banco de dados principal.

### Tabelas necessárias

| Tabela           | Finalidade                                |
| ---------------- | ----------------------------------------- |
| users            | Usuários e permissões                     |
| employees        | Cadastro de funcionários                  |
| schedules        | Identificação das escalas                 |
| schedule_entries | Dias de trabalho e folgas                 |
| availability     | Férias, afastamentos e indisponibilidades |
| company_settings | Configurações da empresa                  |
| audit_logs       | Histórico de alterações                   |

### Estrutura dos dados

employees

- id
- name
- position
- admission_date
- status
- preferences
- created_at
- updated_at

schedules

- id
- name
- start_date
- end_date
- status
- created_by
- published_at
- created_at

schedule_entries

- id
- schedule_id
- employee_id
- date
- status
- notes
- updated_at

company_settings

- id
- company_name
- work_regime
- minimum_staff_per_day
- weekly_work_days
- weekly_rest_days
- operating_days
- timezone
- configuration_json

audit_logs

- id
- user_id
- action
- entity_type
- entity_id
- old_value
- new_value
- created_at

Os campos e relacionamentos definitivos deverão ser revisados pelo desenvolvedor antes da criação do banco.

## 13. Arquitetura recomendada

Sugestão de tecnologias:

| Camada             | Tecnologia    |
| ------------------ | ------------- |
| Frontend           | Next.js       |
| Linguagem          | TypeScript    |
| Interface          | Tailwind CSS  |
| Componentes        | shadcn/ui     |
| Backend            | Supabase      |
| Banco de dados     | PostgreSQL    |
| Autenticação       | Supabase Auth |
| Hospedagem         | Vercel        |
| Controle de versão | GitHub        |

Essa estrutura permite começar pequeno e aumentar o sistema futuramente.

## 14. Segurança

O desenvolvedor deverá implementar:

- Login seguro.
- Recuperação de senha.
- Controle de permissões.
- Proteção das informações dos funcionários.
- Validação dos dados no servidor.
- Políticas de acesso ao banco de dados.
- Registro das alterações.
- Backup periódico do banco.
- Proteção contra exclusões acidentais.

Também deverá observar a LGPD, especialmente quanto ao acesso e armazenamento de dados pessoais.

## 15. Backup e integração com Google Sheets

O Google Sheets será um recurso complementar.

Não deverá ser necessário para o funcionamento do sistema.

### Recursos de backup

Criar dois botões:

Exportar dados

- Exportar funcionários.
- Exportar escalas.
- Exportar histórico.
- Gerar arquivo Excel ou CSV.

Importar dados

- Importar funcionários.
- Importar escalas.
- Validar dados antes da importação.
- Apresentar erros antes de concluir.

### Integração futura com Google Sheets

Em uma segunda etapa, poderá existir uma integração com a API do Google Sheets para enviar os dados automaticamente para uma planilha de backup.

Minha recomendação é deixar essa integração fora da primeira versão. Primeiro precisamos garantir que o sistema web funcione perfeitamente sozinho.

# PARTE 5 — EXPERIÊNCIA DO USUÁRIO E TELAS MOBILE

## 16. Direção visual

Para esse sistema, recomendo um visual de software administrativo moderno, com aparência profissional, limpa e objetiva.

Referências de estilo:

[Modern HTML CSS JS Admin Dashboard — · Built with Blink](https://images.openai.com/static-rsc-4/c9CEhIx44OHxIwGnZePso3BJoTQ4tNuVkVeqI9jNtzYfnTTcuyA1U6qdd0gmwYOzqzvQATmP926MAnoFaSXiZVnBRuYrvxrkUnObn3JnrRCzakH0j4pe8Y531sMuxgfilxa4QZgN1zuQs_ZuTpGYVwoTZ-sGLIHELtHoR8LEfIQ?purpose=inline)

Dashboard administrativo

Cards, indicadores e informações organizadas.

[Shift scheduling software design UI by Ota Skvor on Dribbble](https://images.openai.com/static-rsc-4/CHvP0zju1IccEpIH72SqNQB_3tdJMIg6z8eFCWREy-bwC4WUePqDCuYO-0qsbb279TVdXN_KzaEzFc62f9IWUbeAFs-LwB3vy8bjeylP8VVxQBH22WR4Xm-fm628mcxgO8TOHy_VQOgQ3bLDEY45mF6wFpxJ_v71gCeWGA8k5pE?purpose=inline)

Gestão de escalas

Calendário, horários e distribuição visual.

[gastromatic App: Dienstplan, Zeiten & Abwesenheiten mobil](https://images.openai.com/static-rsc-4/Tfl1I69cicSOE0ll6pBMENNhzW3SN1PiPjJiOgzccQv1AvrYtCRCjSpwipLZdXrl26rIzxYEoP1tKhTxaL4nPd5PRkREUCJWQ5Ry6s1qW0W-Hbp7yVlTTfp4ObCUJXnKDTuRWOkd70ON3T6HcuZ8YFdSfFcZfaOFemrFJebo62U?purpose=inline)

Aplicativo mobile

Interface compacta e fácil de operar.

[Sticky | Mobile Admin Template & Dashboard - Bootstrap 5 UI Kit by Enabled on Dribbble](https://images.openai.com/static-rsc-4/SsRU5FoVeH1UC85GqrsSxhBj1jHdXww37gQ5MD4bR4eC36MJsI8h2Nu4xOW8Mj6BBCCxxUO1yjfm7AmNtoXVVcGTym0IgAkTGgZ5QMdOfe8WgdpfEjGephFkbC_BAlPWjwBtlhhDZeoUvlCnLghlC3vhEWEJy4XhFIHNJHA3MpY?purpose=inline)

Painel no celular

Indicadores e ações rápidas.

### Paleta visual sugerida

| Elemento        | Cor       |
| --------------- | --------- |
| Fundo principal | `#F8FAFC` |
| Cards           | `#FFFFFF` |
| Texto principal | `#172033` |
| Cor primária    | `#2563EB` |
| Trabalho        | `#16A34A` |
| Folga           | `#EF4444` |
| Atenção         | `#F59E0B` |
| Bordas          | `#E2E8F0` |

### Características da interface

- Design minimalista.
- Cantos levemente arredondados.
- Ícones simples.
- Tipografia moderna.
- Botões bem identificados.
- Espaçamento confortável.
- Pouca informação por tela.
- Feedback visual após salvar alterações.

Não quero uma interface com aparência de planilha. Quero que pareça um produto SaaS profissional.

## 17. Telas que devem ser desenhadas no Google Stitch

Recomendo criar oito telas inicialmente:

| Tela                       | Prioridade |
| -------------------------- | ---------- |
| 1. Login                   | Alta       |
| 2. Dashboard               | Alta       |
| 3. Escala semanal          | Muito alta |
| 4. Calendário mensal       | Alta       |
| 5. Funcionários            | Alta       |
| 6. Cadastro de funcionário | Alta       |
| 7. Configurações de escala | Alta       |
| 8. Relatórios e backup     | Média      |

### Adaptações específicas para celular

No mobile, a escala não deve simplesmente reduzir a tabela do computador.

A melhor solução é mudar a organização da informação.

Escala semanal no celular:

- Mostrar os dias em formato de cartões.
- Cada cartão representa um dia.
- Exibir quantas pessoas trabalham.
- Mostrar os nomes dos funcionários.
- Destacar quem está de folga.
- Permitir trocar de semana deslizando ou usando setas.

Dashboard mobile:

- Cards compactos.
- Indicadores em duas colunas.
- Próximas folgas em lista.
- Alertas destacados.
- Acesso rápido à escala.

Menu inferior:

- Início.
- Escala.
- Equipe.
- Relatórios.
- Mais.

# PARTE 6 — PROMPT PARA O GOOGLE STITCH

Abaixo está o prompt principal para utilizar no Google Stitch.

A intenção é pedir ao Stitch que desenvolva as telas de um produto real, e não apenas uma imagem bonita de dashboard.

Recomendo começar pelo mobile e depois solicitar as versões desktop, mantendo a mesma identidade visual.

# PROMPT — SISTEMA WEB DE GESTÃO DE FOLGAS 5X2

Crie o design completo de uma aplicação SaaS chamada **Gestão de Folgas**, destinada ao gerenciamento de funcionários, escalas de trabalho e folgas no regime 5x2.

## 1. OBJETIVO DO PRODUTO

O sistema será utilizado por um administrador para controlar a escala de trabalho de uma equipe inicialmente composta por quatro funcionários.

O objetivo é facilitar a organização das folgas, evitar falta de funcionários nos dias de operação e distribuir os descansos de maneira equilibrada.

A aplicação deverá ser extremamente simples, intuitiva, rápida e profissional.

Não deve parecer uma planilha. Deve parecer um software SaaS moderno de gestão empresarial.

## 2. DIREÇÃO VISUAL

Criar uma interface com:

- Design minimalista e moderno.
- Estética de software SaaS premium.
- Fundo claro.
- Cards brancos.
- Cantos arredondados.
- Sombras discretas.
- Ícones minimalistas.
- Tipografia moderna e legível.
- Hierarquia visual bem definida.
- Poucos elementos por tela.
- Botões com boa área de toque.

Paleta de cores:

- Azul principal: #2563EB
- Fundo: #F8FAFC
- Branco: #FFFFFF
- Texto: #172033
- Verde para trabalho: #16A34A
- Vermelho para folga: #EF4444
- Amarelo para alertas: #F59E0B
- Cinza para elementos secundários: #64748B

Utilizar uma linguagem visual consistente em todas as telas.

## 3. PRIMEIRA VERSÃO: MOBILE FIRST

Desenvolver inicialmente para celulares, com prioridade para telas de 390px de largura.

A interface deve funcionar perfeitamente em:

- iPhone.
- Android.
- Tablets.
- Computadores.

Não reduzir simplesmente as tabelas do desktop. Criar experiências específicas para dispositivos móveis.

## 4. ESTRUTURA DE NAVEGAÇÃO

Criar uma navegação inferior fixa com cinco opções:

1. Início.
2. Escala.
3. Equipe.
4. Relatórios.
5. Mais.

Utilizar ícones Lucide.

A navegação deve ser simples e intuitiva.

## 5. TELA 1 — LOGIN

Criar uma tela de login profissional.

Elementos:

- Logo do Gestão de Folgas.
- Campo de e-mail.
- Campo de senha.
- Botão Entrar.
- Link Esqueci minha senha.

Design limpo, sem elementos desnecessários.

## 6. TELA 2 — DASHBOARD

Criar um painel administrativo com o título "Visão geral".

Na parte superior:

- Nome do sistema.
- Avatar do usuário.
- Data atual.

Criar quatro cards de indicadores:

1. Funcionários ativos.
2. Trabalhando hoje.
3. De folga hoje.
4. Alertas de cobertura.

Criar uma seção chamada "Equipe de hoje".

Mostrar os funcionários com:

- Nome.
- Cargo.
- Status de trabalho ou folga.
- Identificação visual por cores.

Criar uma seção "Próximas folgas".

Mostrar os próximos funcionários que estarão de folga, com suas respectivas datas.

Criar uma seção "Atenção".

Quando houver menos funcionários trabalhando do que o mínimo configurado, apresentar um alerta visual.

## 7. TELA 3 — ESCALA SEMANAL

Esta é a tela mais importante do sistema.

Criar uma interface para gerenciamento da escala semanal.

Na parte superior:

- Título "Escala de trabalho".
- Botão para voltar uma semana.
- Botão para avançar uma semana.
- Identificação do período.
- Botão "Gerar escala".
- Botão "Nova escala".

Mostrar os dias da semana.

No mobile, cada dia deverá ser representado por um cartão.

Cada cartão deve mostrar:

- Nome do dia.
- Data.
- Quantidade de funcionários trabalhando.
- Lista de funcionários trabalhando.
- Lista de funcionários de folga.

Utilizar cores:

- Verde para trabalho.
- Vermelho para folga.
- Amarelo para equipe reduzida.

Criar interação visual para permitir que o administrador selecione um funcionário e altere seu status entre:

- Trabalhando.
- Folga.
- Férias.
- Afastamento.

Mostrar um resumo da quantidade de pessoas trabalhando em cada dia.

## 8. TELA 4 — CALENDÁRIO MENSAL

Criar um calendário mensal moderno.

Permitir:

- Avançar e retroceder meses.
- Consultar os dias de folga.
- Filtrar por funcionário.
- Identificar dias com equipe reduzida.
- Selecionar uma data para abrir os detalhes.

O calendário deve ter uma aparência limpa e não ficar sobrecarregado.

## 9. TELA 5 — EQUIPE

Criar uma tela de gerenciamento dos funcionários.

Mostrar:

- Nome.
- Cargo.
- Status.
- Próximas folgas.

Adicionar um botão destacado "Adicionar funcionário".

Criar busca por nome e filtros por status.

Cada funcionário deve ter uma opção para visualizar seu cadastro e histórico de escalas.

## 10. TELA 6 — CADASTRAR FUNCIONÁRIO

Criar formulário com:

- Nome completo.
- Cargo.
- Data de admissão.
- Status ativo ou inativo.
- Preferências de folga.
- Observações.

Criar botão "Salvar funcionário".

Manter o formulário simples e organizado.

## 11. TELA 7 — CONFIGURAÇÕES DE ESCALA

Criar uma tela para configurar as regras da empresa.

Campos:

- Regime de trabalho.
- Dias de funcionamento.
- Quantidade de funcionários ativos.
- Quantidade mínima de pessoas trabalhando por dia.
- Quantidade de folgas semanais.
- Preferência por folgas consecutivas.
- Rodízio de folgas.
- Rodízio de domingos.
- Dias de maior movimento.
- Carga horária semanal.

Criar uma seção para preferências de distribuição automática.

Adicionar botão "Salvar configurações".

## 12. TELA 8 — RELATÓRIOS E BACKUP

Criar uma tela com:

- Resumo mensal.
- Dias trabalhados por funcionário.
- Total de folgas.
- Domingos de folga.
- Dias com equipe reduzida.
- Histórico das escalas.

Adicionar botões:

- Exportar Excel.
- Exportar CSV.
- Importar planilha.
- Gerar backup.

## 13. COMPONENTES REUTILIZÁVEIS

Criar componentes visuais consistentes para:

- Cards de indicadores.
- Cards de funcionários.
- Status de trabalho.
- Status de folga.
- Alertas.
- Calendário.
- Seletores de data.
- Modais.
- Formulários.
- Botões.
- Menus de navegação.

## 14. EXPERIÊNCIA DO USUÁRIO

O sistema deve priorizar operações rápidas.

As principais ações devem ser realizadas em poucos toques.

Criar estados visuais para:

- Carregamento.
- Sucesso.
- Erro.
- Confirmação.
- Nenhum funcionário cadastrado.
- Nenhuma escala criada.
- Escala com conflito.

Utilizar textos em português brasileiro.

Não utilizar textos genéricos em inglês.

## 15. DADOS DE DEMONSTRAÇÃO

Utilizar quatro funcionários fictícios:

- João.
- Pedro.
- Carlos.
- Paulo.

Criar exemplos de escala 5x2.

Mostrar uma semana em que cada funcionário tenha dois dias de descanso e cinco dias de trabalho.

Considerar que a empresa funciona sete dias por semana e precisa de pelo menos duas pessoas trabalhando por dia.

Os dados são apenas ilustrativos.

## 16. ENTREGA VISUAL

Criar todas as oito telas mantendo:

- A mesma identidade visual.
- A mesma paleta de cores.
- Os mesmos componentes.
- A mesma hierarquia de informações.
- A mesma navegação.

Priorizar a qualidade da experiência mobile.

Criar telas visualmente consistentes, prontas para servir de referência ao desenvolvimento de uma aplicação web real.

O resultado deve transmitir simplicidade, organização, confiabilidade e profissionalismo.

## 18. Como trabalhar no Stitch

Minha sugestão é não pedir todas as telas de uma só vez e aceitar o primeiro resultado sem revisão.

Faça nesta ordem:

1. Cole o prompt principal.
2. Gere as telas mobile.
3. Revise principalmente o Dashboard e a Escala Semanal.
4. Peça ajustes de navegação e espaçamento.
5. Gere as demais telas mantendo a identidade visual.
6. Solicite as versões desktop.
7. Organize o projeto para entregar ao desenvolvedor.

O Stitch será utilizado para criar o projeto visual e prototipar a experiência. O banco de dados, as regras de escala, os logins e as funcionalidades reais precisarão ser implementados pelo DEV.

# PARTE 7 — CRITÉRIOS DE ENTREGA PARA O DESENVOLVEDOR

## 19. O que deverá funcionar na primeira versão (MVP)

Eu dividiria o desenvolvimento em três etapas.

FASE 1 — Sistema funcional

Obrigatória

- Login administrativo.
- Cadastro de funcionários.
- Dashboard.
- Criação manual de escalas.
- Visualização semanal.
- Calendário mensal.
- Configuração de regras.
- Salvamento no banco de dados.\


  FASE 2 — Automação

  Prioridade alta
- Gerador automático de escalas.
- Rodízio de folgas.
- Rodízio de domingos.
- Alertas de cobertura.
- Histórico de alterações.
- Relatórios.\


  FASE 3 — Melhorias

  Futuro
- Integração com Google Sheets.
- Notificações de alterações.
- Acesso individual dos funcionários.
- Compartilhamento da escala.
- Instalação como PWA (aplicativo web).

## 20. Critérios de aceitação

O DEV deverá entregar o sistema com os seguintes testes aprovados:

| Teste                   | Resultado esperado                  |
| ----------------------- | ----------------------------------- |
| Cadastrar funcionário   | Funcionário aparece na equipe       |
| Criar escala            | Escala fica salva no banco          |
| Alterar folga           | Indicadores são atualizados         |
| Gerar escala automática | Distribuição respeita as regras     |
| Cobertura insuficiente  | Sistema apresenta alerta            |
| Desativar funcionário   | Histórico permanece                 |
| Publicar escala         | Escala fica disponível como oficial |
| Exportar dados          | Arquivo é gerado corretamente       |
| Acessar pelo celular    | Interface funciona corretamente     |
| Restaurar backup        | Dados são recuperados               |

## 21. Orientações importantes para o DEV

Alguns pontos que eu considero fundamentais:

1\. Não deixar as regras fixas no código.

Se futuramente você tiver seis funcionários, quiser trabalhar com três pessoas por dia ou alterar a distribuição das folgas, deverá conseguir fazer isso nas configurações.

2\. Separar o motor de escala da interface.

O algoritmo de distribuição deve funcionar independentemente das telas. Assim, será possível melhorar a inteligência da escala sem precisar reconstruir o sistema.

3\. Não perder informações.

Alterações e escalas publicadas precisam ter histórico. O backup deve incluir os dados necessários para restaurar o sistema.

4\. Preparar para crescimento.

Embora inicialmente sejam quatro funcionários, a estrutura deve permitir cadastrar 10, 20 ou mais pessoas sem precisar refazer o projeto.

5\. Validar as regras trabalhistas.

O sistema deve permitir configurar a jornada, os descansos, os intervalos e as restrições aplicáveis, sem presumir que a simples contagem de cinco dias trabalhados e dois descansos garante conformidade legal.

# PARTE 8 — MINHA RECOMENDAÇÃO FINAL

Eu seguiria exatamente esta ordem de trabalho:

1. Google Stitch

   Criar todas as telas mobile e desktop e definir a identidade visual.
2. Desenvolvimento frontend

   Transformar o projeto visual em uma aplicação web funcional.
3. Banco de dados e autenticação

   Configurar Supabase, login e armazenamento.
4. Motor de escalas

   Desenvolver as regras de distribuição automática e validação.
5. Testes

   Testar com quatro funcionários e diferentes cenários de folgas.
6. Publicação

   Hospedar o sistema e disponibilizar um endereço próprio.

## Uma decisão que ainda precisamos tomar

Para evitar que o desenvolvedor construa algo diferente do que você espera, preciso definir uma característica importante:

Você quer que o sistema seja exclusivamente para você administrar as folgas ou pretende que os funcionários também possam consultar suas próprias escalas pelo celular?

Isso influencia a arquitetura de usuários, permissões e algumas telas. Minha recomendação inicial é deixar o acesso administrativo pronto e preparar a estrutura para liberar o acesso dos funcionários futuramente.