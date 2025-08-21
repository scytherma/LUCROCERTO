// Configurações da Shopee
const SHOPEE_CONFIG = {
    taxaComissaoPadrao: 0.14,
    taxaComissaoFreteGratis: 0.20,
    taxaTransacao: 0.00,
    taxaFixaPorItem: 4.00,
};

// Multiplicadores
let multiplicadorCustoShopee = 1;
let multiplicadorCustoML = 1;

// Sistema de Abas
document.addEventListener("DOMContentLoaded", function() {
    initializeTabs();
    initializeShopeeCalculator();
    initializeMercadoLivreCalculator();
    initializeUserMenu();
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-tab').classList.add('active');
        });
    });
}

// ===================== SHOPEE =====================
function initializeShopeeCalculator() {
    const elements = {
        freteGratis: document.getElementById("freteGratis"),
        custoProduto: document.getElementById("custoProduto"),
        impostos: document.getElementById("impostos"),
        despesasVariaveis: document.getElementById("despesasVariaveis"),
        margemLucro: document.getElementById("margemLucro"),
        custosExtrasContainer: document.getElementById("custosExtrasContainer"),
        addCustoExtraBtn: document.querySelector(".add-custo-extra-btn:not([data-target])"),
        limparCamposBtn: document.getElementById("limparCamposBtn"),
        precoVenda: document.getElementById("precoVenda"),
        lucroPorVenda: document.getElementById("lucroPorVenda"),
        taxaShopee: document.getElementById("taxaShopee"),
        valorImpostos: document.getElementById("valorImpostos"),
        custoTotal: document.getElementById("custoTotal"),
        retornoProduto: document.getElementById("retornoProduto"),
        markupPercent: document.getElementById("markupPercent"),
        markupX: document.getElementById("markupX"),
        margemValue: document.getElementById("margemValue")
    };

    if (elements.margemLucro) {
        elements.margemLucro.addEventListener("input", function() {
            atualizarMargemValue(elements.margemValue, this.value);
            atualizarCorMargem(this, this.value);
            calcularPrecoVendaShopee();
        });
    }

    const arrowUp = document.querySelector(".arrow-up:not([data-target])");
    const arrowDown = document.querySelector(".arrow-down:not([data-target])");

    if (arrowUp) {
        arrowUp.addEventListener("click", () => {
            multiplicadorCustoShopee = Math.max(1, multiplicadorCustoShopee + 1);
            document.querySelector(".multiplier:not([id])").textContent = `${multiplicadorCustoShopee}x`;
            calcularPrecoVendaShopee();
        });
    }

    if (arrowDown) {
        arrowDown.addEventListener("click", () => {
            multiplicadorCustoShopee = Math.max(1, multiplicadorCustoShopee - 1);
            document.querySelector(".multiplier:not([id])").textContent = `${multiplicadorCustoShopee}x`;
            calcularPrecoVendaShopee();
        });
    }

    [elements.custoProduto, elements.despesasVariaveis].forEach(element => {
        if (element) {
            element.addEventListener("input", function() {
                validarEntradaNumerica(this);
                calcularPrecoVendaShopee();
            });
            element.addEventListener("blur", function() {
                formatarCampo(this);
                calcularPrecoVendaShopee();
            });
        }
    });

    if (elements.impostos) {
        elements.impostos.addEventListener("input", function() {
            validarEntradaNumerica(this);
            calcularPrecoVendaShopee();
        });
        elements.impostos.addEventListener("blur", function() {
            let valorString = this.value.replace(",", ".");
            let valor = parseFloat(valorString);
            if (isNaN(valor) || valor < 0) {
                this.value = "0,00";
            } else if (valor > 100) {
                this.value = "100,00";
            } else {
                this.value = valor.toFixed(2).replace(".", ",");
            }
            calcularPrecoVendaShopee();
        });
    }

    if (elements.freteGratis) {
        elements.freteGratis.addEventListener("change", calcularPrecoVendaShopee);
    }

    if (elements.addCustoExtraBtn) {
        elements.addCustoExtraBtn.addEventListener("click", () => adicionarCustoExtra(""));
    }

    if (elements.limparCamposBtn) {
        elements.limparCamposBtn.addEventListener("click", resetarCalculadoraShopee);
    }

    atualizarMargemValue(elements.margemValue, 0);
    calcularPrecoVendaShopee();
}

function calcularPrecoVendaShopee() {
    const custoProdutoValue = document.getElementById("custoProduto").value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoShopee;

    const impostosValue = document.getElementById("impostos").value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;

    const despesasValue = document.getElementById("despesasVariaveis").value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;

    const margemDesejada = parseFloat(document.getElementById("margemLucro").value) || 0;
    const temFreteGratis = document.getElementById("freteGratis").checked;

    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;

    document.querySelectorAll("#custosExtrasContainer .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");
        const valor = parseFloat(valueInput.value.replace(",", ".")) || 0;
        const tipo = typeSelector.value;
        if (tipo === "real") {
            custosExtrasReais += valor;
        } else if (tipo === "percent") {
            custosExtrasPercentuais += (valor / 100);
        }
    });

    const custoTotalProduto = custoProduto + custosExtrasReais;
    const taxaComissaoAplicada = temFreteGratis ? SHOPEE_CONFIG.taxaComissaoFreteGratis : SHOPEE_CONFIG.taxaComissaoPadrao;

    const denominador = (1 - taxaComissaoAplicada - (margemDesejada / 100) - (impostosPercent / 100) - custosExtrasPercentuais);
    let precoVenda = 0;
    if (denominador > 0) {
        precoVenda = (custoTotalProduto + despesasVariaveis + SHOPEE_CONFIG.taxaFixaPorItem) / denominador;
    }

    const valorImpostos = precoVenda * (impostosPercent / 100);
    const valorCustosExtrasPercentuais = precoVenda * custosExtrasPercentuais;
    const taxaShopeeComissao = precoVenda * taxaComissaoAplicada;
    const taxaShopeeValorTotal = taxaShopeeComissao + SHOPEE_CONFIG.taxaFixaPorItem;

    const lucroLiquido = precoVenda - custoTotalProduto - despesasVariaveis - taxaShopeeValorTotal - valorImpostos - valorCustosExtrasPercentuais;

    const retornoProduto = custoTotalProduto > 0 ? (lucroLiquido / custoTotalProduto) * 100 : 0;
    const markupPercent = custoTotalProduto > 0 ? ((precoVenda - custoTotalProduto) / custoTotalProduto) * 100 : 0;
    const markupX = custoTotalProduto > 0 ? precoVenda / custoTotalProduto : 0;

    atualizarResultadosShopee({
        precoVenda,
        lucroLiquido,
        taxaShopeeValor: taxaShopeeValorTotal,
        valorImpostos,
        custoTotalProduto,
        retornoProduto,
        markupPercent,
        markupX
    });
}

function atualizarResultadosShopee(resultados) {
    document.getElementById("precoVenda").textContent = formatarReal(resultados.precoVenda);
    document.getElementById("lucroPorVenda").textContent = formatarReal(resultados.lucroLiquido);
    document.getElementById("taxaShopee").textContent = formatarReal(resultados.taxaShopeeValor);
    document.getElementById("valorImpostos").textContent = formatarReal(resultados.valorImpostos);
    document.getElementById("custoTotal").textContent = formatarReal(resultados.custoTotalProduto);
    document.getElementById("retornoProduto").textContent = formatarPercentual(resultados.retornoProduto);
    document.getElementById("markupPercent").textContent = formatarPercentual(resultados.markupPercent);
    document.getElementById("markupX").textContent = `${resultados.markupX.toFixed(2)}X`;

    const lucroPorVendaElement = document.getElementById("lucroPorVenda");
    if (resultados.lucroLiquido > 0) {
        lucroPorVendaElement.style.color = "#4CAF50";
    } else if (resultados.lucroLiquido < 0) {
        lucroPorVendaElement.style.color = "#f44336";
    } else {
        lucroPorVendaElement.style.color = "#ff6b35";
    }
}

function resetarCalculadoraShopee() {
    document.getElementById("custoProduto").value = "";
    document.getElementById("impostos").value = "";
    document.getElementById("despesasVariaveis").value = "";
    document.getElementById("margemLucro").value = 0;
    document.getElementById("freteGratis").checked = true;
    multiplicadorCustoShopee = 1;
    document.querySelector(".multiplier:not([id])").textContent = "1x";
    document.getElementById("custosExtrasContainer").innerHTML = '';
    atualizarMargemValue(document.getElementById("margemValue"), 0);
    calcularPrecoVendaShopee();
}

// ===================== MERCADO LIVRE =====================
function initializeMercadoLivreCalculator() {
    const elements = {
        custoProduto: document.getElementById("custoProdutoML"),
        impostos: document.getElementById("impostosML"),
        despesasVariaveis: document.getElementById("despesasVariaveisML"),
        taxaMercadoLivreSelect: document.getElementById("taxaMercadoLivreSelect"),
        taxaFreteSelect: document.getElementById("taxaFreteSelect"),
        margemLucro: document.getElementById("margemLucroML"),
        custosExtrasContainer: document.getElementById("custosExtrasContainerML"),
        addCustoExtraBtn: document.querySelector(".add-custo-extra-btn[data-target='ML']"),
        limparCamposBtn: document.getElementById("limparCamposBtnML"),
        precoVenda: document.getElementById("precoVendaML"),
        lucroPorVenda: document.getElementById("lucroPorVendaML"),
        taxaMercadoLivre: document.getElementById("taxaMercadoLivre"),
        valorImpostos: document.getElementById("valorImpostosML"),
        custoTotal: document.getElementById("custoTotalML"),
        retornoProduto: document.getElementById("retornoProdutoML"),
        markupPercent: document.getElementById("markupPercentML"),
        markupX: document.getElementById("markupXML"),
        margemValue: document.getElementById("margemValueML")
    };

    if (elements.margemLucro) {
        elements.margemLucro.addEventListener("input", function() {
            atualizarMargemValue(elements.margemValue, this.value);
            atualizarCorMargem(this, this.value);
            calcularPrecoVendaML();
        });
    }

    const arrowUpML = document.querySelector(".arrow-up[data-target='ML']");
    const arrowDownML = document.querySelector(".arrow-down[data-target='ML']");

    if (arrowUpML) {
        arrowUpML.addEventListener("click", () => {
            multiplicadorCustoML = Math.max(1, multiplicadorCustoML + 1);
            document.getElementById("multiplierML").textContent = `${multiplicadorCustoML}x`;
            calcularPrecoVendaML();
        });
    }

    if (arrowDownML) {
        arrowDownML.addEventListener("click", () => {
            multiplicadorCustoML = Math.max(1, multiplicadorCustoML - 1);
            document.getElementById("multiplierML").textContent = `${multiplicadorCustoML}x`;
            calcularPrecoVendaML();
        });
    }

    [elements.custoProduto, elements.despesasVariaveis].forEach(element => {
        if (element) {
            element.addEventListener("input", function() {
                validarEntradaNumerica(this);
                calcularPrecoVendaML();
            });
            element.addEventListener("blur", function() {
                formatarCampo(this);
                calcularPrecoVendaML();
            });
        }
    });

    if (elements.impostos) {
        elements.impostos.addEventListener("input", function() {
            validarEntradaNumerica(this);
            calcularPrecoVendaML();
        });
        elements.impostos.addEventListener("blur", function() {
            let valorString = this.value.replace(",", ".");
            let valor = parseFloat(valorString);
            if (isNaN(valor) || valor < 0) {
                this.value = "0,00";
            } else if (valor > 100) {
                this.value = "100,00";
            } else {
                this.value = valor.toFixed(2).replace(".", ",");
            }
            calcularPrecoVendaML();
        });
    }

    if (elements.taxaMercadoLivreSelect) {
        elements.taxaMercadoLivreSelect.addEventListener("change", calcularPrecoVendaML);
    }

    if (elements.taxaFreteSelect) {
        elements.taxaFreteSelect.addEventListener("change", calcularPrecoVendaML);
    }

    if (elements.addCustoExtraBtn) {
        elements.addCustoExtraBtn.addEventListener("click", () => adicionarCustoExtra("ML"));
    }

    if (elements.limparCamposBtn) {
        elements.limparCamposBtn.addEventListener("click", resetarCalculadoraML);
    }

    atualizarMargemValue(elements.margemValue, 0);
    calcularPrecoVendaML();
}

function calcularPrecoVendaML() {
    const custoProdutoValue = document.getElementById("custoProdutoML").value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoML;

    const impostosValue = document.getElementById("impostosML").value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;

    const despesasValue = document.getElementById("despesasVariaveisML").value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;

    const margemDesejada = parseFloat(document.getElementById("margemLucroML").value) || 0;

    const taxaMLPercent = parseFloat(document.getElementById("taxaMercadoLivreSelect").value) || 12;
    const taxaML = taxaMLPercent / 100;

    const taxaFrete = parseFloat(document.getElementById("taxaFreteSelect").value) || 0;

    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;

    document.querySelectorAll("#custosExtrasContainerML .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");
        const valor = parseFloat(valueInput.value.replace(",", ".")) || 0;
        const tipo = typeSelector.value;
        if (tipo === "real") {
            custosExtrasReais += valor;
        } else if (tipo === "percent") {
            custosExtrasPercentuais += (valor / 100);
        }
    });

    const custoTotalProduto = custoProduto + custosExtrasReais;

    const denominador = (1 - taxaML - (margemDesejada / 100) - (impostosPercent / 100) - custosExtrasPercentuais);
    let precoVenda = 0;
    if (denominador > 0) {
        precoVenda = (custoTotalProduto + despesasVariaveis + taxaFrete) / denominador;
    }

    const valorImpostos = precoVenda * (impostosPercent / 100);
    const valorCustosExtrasPercentuais = precoVenda * custosExtrasPercentuais;
    const taxaMLValor = precoVenda * taxaML;

    const lucroLiquido = precoVenda - custoTotalProduto - despesasVariaveis - taxaFrete - taxaMLValor - valorImpostos - valorCustosExtrasPercentuais;

    const retornoProduto = custoTotalProduto > 0 ? (lucroLiquido / custoTotalProduto) * 100 : 0;
    const markupPercent = custoTotalProduto > 0 ? ((precoVenda - custoTotalProduto) / custoTotalProduto) * 100 : 0;
    const markupX = custoTotalProduto > 0 ? precoVenda / custoTotalProduto : 0;

    atualizarResultadosML({
        precoVenda,
        lucroLiquido,
        taxaMLValor,
        valorImpostos,
        custoTotalProduto,
        retornoProduto,
        markupPercent,
        markupX
    });
}

function atualizarResultadosML(resultados) {
    document.getElementById("precoVendaML").textContent = formatarReal(resultados.precoVenda);
    document.getElementById("lucroPorVendaML").textContent = formatarReal(resultados.lucroLiquido);
    document.getElementById("taxaMercadoLivre").textContent = formatarReal(resultados.taxaMLValor);
    document.getElementById("valorImpostosML").textContent = formatarReal(resultados.valorImpostos);
    document.getElementById("custoTotalML").textContent = formatarReal(resultados.custoTotalProduto);
    document.getElementById("retornoProdutoML").textContent = formatarPercentual(resultados.retornoProduto);
    document.getElementById("markupPercentML").textContent = formatarPercentual(resultados.markupPercent);
    document.getElementById("markupXML").textContent = `${resultados.markupX.toFixed(2)}X`;

    const lucroPorVendaElement = document.getElementById("lucroPorVendaML");
    if (resultados.lucroLiquido > 0) {
        lucroPorVendaElement.style.color = "#4CAF50";
    } else if (resultados.lucroLiquido < 0) {
        lucroPorVendaElement.style.color = "#f44336";
    } else {
        lucroPorVendaElement.style.color = "#ff6b35";
    }
}

function resetarCalculadoraML() {
    document.getElementById("custoProdutoML").value = "";
    document.getElementById("impostosML").value = "";
    document.getElementById("despesasVariaveisML").value = "";
    document.getElementById("margemLucroML").value = 0;
    multiplicadorCustoML = 1;
    document.getElementById("multiplierML").textContent = "1x";
    document.getElementById("custosExtrasContainerML").innerHTML = '';
    atualizarMargemValue(document.getElementById("margemValueML"), 0);
    calcularPrecoVendaML();
}

// ===================== UTILITÁRIOS =====================
function validarEntradaNumerica(input) {
    input.value = input.value.replace(/[^0-9,]/g, '');
}

function formatarCampo(input) {
    let valor = parseFloat(input.value.replace(",", ".")) || 0;
    input.value = valor.toFixed(2).replace(".", ",");
}

function atualizarMargemValue(spanElement, value) {
    if (spanElement) {
        spanElement.textContent = `${value}%`;
    }
}

function atualizarCorMargem(input, value) {
    if (value < 20) input.style.setProperty('--thumb-color', '#f44336');
    else if (value < 40) input.style.setProperty('--thumb-color', '#ff9800');
    else input.style.setProperty('--thumb-color', '#4CAF50');
}

function adicionarCustoExtra(target) {
    const containerId = target === "ML" ? "custosExtrasContainerML" : "custosExtrasContainer";
    const container = document.getElementById(containerId);

    const div = document.createElement("div");
    div.className = "custo-extra-item";
    div.innerHTML = `
        <input type=\"text\" class=\"custo-extra-value\" placeholder=\"0,00\">
        <select class=\"custo-extra-type-selector\">
            <option value=\"real\">R$</option>
            <option value=\"percent\">%</option>
        </select>
        <button type=\"button\" class=\"remove-custo-extra\">x</button>
    `;
    container.appendChild(div);

    const valueInput = div.querySelector(\".custo-extra-value\");
    valueInput.addEventListener(\"input\", function() {
        validarEntradaNumerica(this);
        if (target === \"ML\") calcularPrecoVendaML(); else calcularPrecoVendaShopee();
    });
    valueInput.addEventListener(\"blur\", function() {
        formatarCampo(this);
        if (target === \"ML\") calcularPrecoVendaML(); else calcularPrecoVendaShopee();
    });

    div.querySelector(\".custo-extra-type-selector\").addEventListener(\"change\", () => {
        if (target === \"ML\") calcularPrecoVendaML(); else calcularPrecoVendaShopee();
    });

    div.querySelector(\".remove-custo-extra\").addEventListener(\"click\", () => {
        div.remove();
        if (target === \"ML\") calcularPrecoVendaML(); else calcularPrecoVendaShopee();
    });
}

function formatarReal(valor) {
    return valor.toLocaleString(\"pt-BR\", { style: \"currency\", currency: \"BRL\" });
}

function formatarPercentual(valor) {
    return `${valor.toFixed(2)}%`;
}

// ===================== USER MENU =====================
function initializeUserMenu() {
    const userIconBtn = document.getElementById(\"userIconBtn\");\n    const userDropdownMenu = document.getElementById(\"userDropdownMenu\");\n    const logoutBtn = document.getElementById(\"logoutBtn\");\n    const themeToggle = document.getElementById(\"themeToggle\");\n\n    if (userIconBtn) {\n        userIconBtn.addEventListener(\"click\", () => {\n            userDropdownMenu.classList.toggle(\"active\");\n        });\n    }\n\n    if (logoutBtn) {\n        logoutBtn.addEventListener(\"click\", async () => {\n            await supabaseClient.auth.signOut();\n            window.location.href = \"login.html\";\n        });\n    }\n\n    if (themeToggle) {\n        themeToggle.addEventListener(\"change\", () => {\n            document.body.classList.toggle(\"dark-mode\", themeToggle.checked);\n        });\n    }\n}\n```  \n\n---\n\n🚀 Agora sim: **`script.js` completo** (Shopee + Mercado Livre com todas as taxas e fretes).  \n\n👉 Quer que eu já monte um `.zip` com o **`index.html` final** + **`script.js` final** juntos pra você baixar e substituir direto no seu projeto?
