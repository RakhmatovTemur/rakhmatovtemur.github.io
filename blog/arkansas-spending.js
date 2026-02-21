(() => {
  const svg = document.getElementById('arkansas-spending-chart');
  const legendRoot = document.getElementById('spending-legend');
  const tooltip = document.getElementById('chart-tooltip');
  const summary = document.getElementById('chart-summary');
  const chartCard = document.querySelector('.chart-card');

  if (!svg || !legendRoot || !tooltip || !summary || !chartCard) {
    return;
  }

  const growthMetric = document.getElementById('metric-growth');
  const growthMetricLabel = document.getElementById('metric-growth-label');
  const teacherShareMetric = document.getElementById('metric-teacher-share');
  const supportShareMetric = document.getElementById('metric-support-share');
  const modeButtons = [...document.querySelectorAll('.mode-button[data-mode]')];

  const categories = [
    {
      id: 'teacherSalary',
      label: 'Teacher/Instructor Salary',
      color: '#e8854a',
      icon: '🎓'
    },
    {
      id: 'nonTeachingSalary',
      label: 'Non-Teaching Staff Salary',
      color: '#d4a843',
      icon: '👥'
    },
    {
      id: 'administration',
      label: 'Administration',
      color: '#a3b86a',
      icon: '🏛️'
    },
    {
      id: 'facilitiesTransport',
      label: 'Facilities and Transportation',
      color: '#6a9fbf',
      icon: '🚌'
    },
    {
      id: 'studentSupport',
      label: 'Student Support Services',
      color: '#bf7a9b',
      icon: '🤝'
    },
    {
      id: 'materialsTech',
      label: 'Instructional Materials and Technology',
      color: '#5bbfb0',
      icon: '💻'
    },
    {
      id: 'otherPrograms',
      label: 'Other Programs',
      color: '#bf9a5b',
      icon: '🌟'
    }
  ];

  // Nominal anchors in billions of USD.
  // Real values are computed by multiplying nominal values by deflatorTo2024.
  const baseSeries = [
    {
      year: 1960,
      label: '1960',
      estimated: true,
      nominalTotal: 0.095,
      deflatorTo2024: 10.59,
      shares: {
        teacherSalary: 0.6535,
        nonTeachingSalary: 0.1485,
        administration: 0.0495,
        facilitiesTransport: 0.1089,
        studentSupport: 0,
        materialsTech: 0,
        otherPrograms: 0.0396
      }
    },
    {
      year: 1980,
      label: '1980',
      estimated: false,
      nominalTotal: 0.667,
      deflatorTo2024: 3.79,
      shares: {
        teacherSalary: 0.5613,
        nonTeachingSalary: 0.1818,
        administration: 0.0711,
        facilitiesTransport: 0.1225,
        studentSupport: 0.0277,
        materialsTech: 0,
        otherPrograms: 0.0356
      }
    },
    {
      year: 2000,
      label: '2000',
      estimated: false,
      nominalTotal: 2.38,
      deflatorTo2024: 1.81,
      shares: {
        teacherSalary: 0.514,
        nonTeachingSalary: 0.1986,
        administration: 0.1005,
        facilitiesTransport: 0.1075,
        studentSupport: 0.0421,
        materialsTech: 0.0187,
        otherPrograms: 0.0187
      }
    },
    {
      year: 2020,
      label: '2020',
      estimated: true,
      nominalTotal: 5.15,
      deflatorTo2024: 1.21,
      shares: {
        teacherSalary: 0.475,
        nonTeachingSalary: 0.209,
        administration: 0.119,
        facilitiesTransport: 0.106,
        studentSupport: 0.053,
        materialsTech: 0.026,
        otherPrograms: 0.012
      }
    },
    {
      year: 2024,
      label: '2024',
      estimated: true,
      nominalTotal: 6.62,
      deflatorTo2024: 1,
      shares: {
        teacherSalary: 0.458,
        nonTeachingSalary: 0.213,
        administration: 0.125,
        facilitiesTransport: 0.107,
        studentSupport: 0.059,
        materialsTech: 0.027,
        otherPrograms: 0.011
      }
    }
  ];

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const moneyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  let currentMode = 'real';
  let renderedSeries = [];
  let lockedCategory = null;

  const interactiveElements = [];
  const legendButtons = new Map();

  function modeLabel() {
    return currentMode === 'real' ? '2024 dollars' : 'nominal dollars';
  }

  function defaultSummaryText() {
    return `Hover over any block or flow to inspect category-level changes (${modeLabel()}).`;
  }

  function formatBillions(value) {
    if (value >= 1) {
      return `$${moneyFormatter.format(value)}B`;
    }

    return `$${Math.round(value * 1000)}M`;
  }

  function toPercent(value, total) {
    if (!total) {
      return 0;
    }

    return (value / total) * 100;
  }

  function buildSeries(mode) {
    return baseSeries.map((slice) => {
      const factor = mode === 'real' ? slice.deflatorTo2024 : 1;
      const total = slice.nominalTotal * factor;
      const categoryValues = {};

      categories.forEach((category) => {
        categoryValues[category.id] = total * (slice.shares[category.id] || 0);
      });

      return {
        year: slice.year,
        label: slice.label,
        estimated: slice.estimated,
        total,
        categories: categoryValues
      };
    });
  }

  function buildMetrics() {
    const first = renderedSeries[0];
    const last = renderedSeries[renderedSeries.length - 1];

    const growth = last.total / first.total;
    const teacherShare = toPercent(last.categories.teacherSalary, last.total);
    const supportShare = toPercent(
      last.categories.nonTeachingSalary +
        last.categories.administration +
        last.categories.facilitiesTransport +
        last.categories.studentSupport +
        last.categories.materialsTech +
        last.categories.otherPrograms,
      last.total
    );

    if (growthMetric) {
      growthMetric.textContent = `${growth.toFixed(1)}x`;
    }

    if (growthMetricLabel) {
      growthMetricLabel.textContent =
        currentMode === 'real'
          ? 'Growth in real spending since 1960'
          : 'Growth in nominal spending since 1960';
    }

    if (teacherShareMetric) {
      teacherShareMetric.textContent = `${teacherShare.toFixed(1)}%`;
    }

    if (supportShareMetric) {
      supportShareMetric.textContent = `${supportShare.toFixed(1)}%`;
    }
  }

  function svgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });

    return element;
  }

  function renderLegend() {
    legendRoot.innerHTML = '';
    legendButtons.clear();

    categories.forEach((category) => {
      const item = document.createElement('li');
      item.className = 'legend-item';

      const button = document.createElement('button');
      button.className = 'legend-button';
      button.type = 'button';
      button.dataset.category = category.id;
      button.setAttribute('aria-pressed', 'false');

      const dot = document.createElement('span');
      dot.className = 'legend-dot';
      dot.style.backgroundColor = category.color;

      const icon = document.createElement('span');
      icon.className = 'legend-icon';
      icon.textContent = category.icon;

      const text = document.createElement('span');
      text.className = 'legend-text';
      text.textContent = category.label;

      button.append(dot, icon, text);
      item.append(button);
      legendRoot.append(item);
      legendButtons.set(category.id, button);

      button.addEventListener('mouseenter', () => {
        if (!lockedCategory) {
          applyCategoryFocus(category.id);
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!lockedCategory) {
          clearCategoryFocus();
        }
      });

      button.addEventListener('click', () => {
        if (lockedCategory === category.id) {
          lockedCategory = null;
          clearCategoryFocus();
        } else {
          lockedCategory = category.id;
          applyCategoryFocus(category.id);
        }
      });
    });
  }

  function updateLegendState(categoryId) {
    legendButtons.forEach((button, id) => {
      const isActive = id === categoryId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function updateSummary(categoryId) {
    if (!categoryId) {
      summary.textContent = defaultSummaryText();
      return;
    }

    const category = categoryById.get(categoryId);
    const first = renderedSeries[0];
    const last = renderedSeries[renderedSeries.length - 1];

    const start = first.categories[categoryId] || 0;
    const end = last.categories[categoryId] || 0;
    const trend = end >= start ? 'increased' : 'decreased';

    summary.textContent = `${category.label}: ${formatBillions(start)} in ${first.year} to ${formatBillions(end)} in ${last.year}; trend ${trend} (${modeLabel()}).`;
  }

  function applyCategoryFocus(categoryId) {
    svg.classList.toggle('chart-faded', Boolean(categoryId));

    interactiveElements.forEach((element) => {
      const isMatch = categoryId && element.dataset.category === categoryId;
      element.classList.toggle('focused', Boolean(isMatch));
    });

    updateLegendState(categoryId);
    updateSummary(categoryId);
  }

  function clearCategoryFocus() {
    applyCategoryFocus(null);
  }

  function renderTooltip(data) {
    tooltip.innerHTML = `
      <div class="tooltip-title">${data.title}</div>
      <div class="tooltip-value">${data.value}</div>
      <div class="tooltip-pct">${data.meta}</div>
      ${data.detail ? `<div class="tooltip-detail">${data.detail}</div>` : ''}
    `;
  }

  function showTooltip(event, data) {
    renderTooltip(data);
    tooltip.classList.add('visible');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const rect = chartCard.getBoundingClientRect();
    const offset = 12;

    let left = event.clientX - rect.left + offset;
    let top = event.clientY - rect.top + offset;

    if (left + tooltip.offsetWidth > rect.width - 8) {
      left = event.clientX - rect.left - tooltip.offsetWidth - offset;
    }

    if (left < 8) {
      left = 8;
    }

    if (top + tooltip.offsetHeight > rect.height - 8) {
      top = event.clientY - rect.top - tooltip.offsetHeight - offset;
    }

    if (top < 8) {
      top = 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }

  function attachInteractions(element, categoryId, tooltipBuilder) {
    element.dataset.category = categoryId;
    interactiveElements.push(element);

    element.addEventListener('mouseenter', (event) => {
      if (!lockedCategory) {
        applyCategoryFocus(categoryId);
      }

      showTooltip(event, tooltipBuilder());
    });

    element.addEventListener('mousemove', moveTooltip);

    element.addEventListener('mouseleave', () => {
      hideTooltip();

      if (!lockedCategory) {
        clearCategoryFocus();
      }
    });

    element.addEventListener('focus', () => {
      if (!lockedCategory) {
        applyCategoryFocus(categoryId);
      }
    });

    element.addEventListener('blur', () => {
      if (!lockedCategory) {
        clearCategoryFocus();
      }
    });

    element.addEventListener('click', () => {
      if (lockedCategory === categoryId) {
        lockedCategory = null;
        clearCategoryFocus();
      } else {
        lockedCategory = categoryId;
        applyCategoryFocus(categoryId);
      }
    });
  }

  function ribbonPath(source, target) {
    const x0 = source.x + source.width;
    const x1 = target.x;
    const curve = Math.min(150, (x1 - x0) * 0.5);

    return [
      `M${x0},${source.y}`,
      `C${x0 + curve},${source.y} ${x1 - curve},${target.y} ${x1},${target.y}`,
      `L${x1},${target.y + target.height}`,
      `C${x1 - curve},${target.y + target.height} ${x0 + curve},${source.y + source.height} ${x0},${source.y + source.height}`,
      'Z'
    ].join(' ');
  }

  function addFlowGradients(defs) {
    categories.forEach((category) => {
      const gradient = svgElement('linearGradient', {
        id: `flow-gradient-${category.id}`,
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '0%'
      });

      gradient.append(
        svgElement('stop', {
          offset: '0%',
          'stop-color': category.color,
          'stop-opacity': 0.5
        }),
        svgElement('stop', {
          offset: '50%',
          'stop-color': category.color,
          'stop-opacity': 0.3
        }),
        svgElement('stop', {
          offset: '100%',
          'stop-color': category.color,
          'stop-opacity': 0.5
        })
      );

      defs.append(gradient);
    });
  }

  function renderChart() {
    const width = 1200;
    const height = 640;
    const margin = { top: 74, right: 70, bottom: 94, left: 118 };
    const axisTickX = margin.left - 14;
    const axisTitleX = 28;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const baseY = margin.top + innerHeight;
    const barWidth = 94;
    const xStep = (innerWidth - barWidth) / (renderedSeries.length - 1);
    const maxTotal = Math.max(...renderedSeries.map((slice) => slice.total));
    const scaleY = innerHeight / maxTotal;

    svg.innerHTML = '';
    interactiveElements.length = 0;

    const defs = svgElement('defs');
    addFlowGradients(defs);

    const gridGroup = svgElement('g');
    const flowsGroup = svgElement('g');
    const barsGroup = svgElement('g');
    const labelsGroup = svgElement('g');

    const tickCount = 6;

    for (let tick = 0; tick <= tickCount; tick += 1) {
      const value = (maxTotal / tickCount) * tick;
      const y = baseY - value * scaleY;

      const line = svgElement('line', {
        x1: margin.left - 8,
        x2: width - margin.right + 8,
        y1: y,
        y2: y,
        class: 'grid-line'
      });

      const label = svgElement('text', {
        x: axisTickX,
        y: y + 4,
        'text-anchor': 'end',
        class: 'tick-label'
      });
      label.textContent = `$${value.toFixed(1)}B`;

      gridGroup.append(line, label);
    }

    const axisLabel = svgElement('text', {
      x: axisTitleX,
      y: margin.top + innerHeight / 2,
      class: 'axis-label',
      transform: `rotate(-90 ${axisTitleX} ${margin.top + innerHeight / 2})`
    });
    axisLabel.textContent =
      currentMode === 'real'
        ? 'Annual spending (2024 dollars)'
        : 'Annual spending (nominal dollars)';

    labelsGroup.append(axisLabel);

    const nodesByYear = [];

    renderedSeries.forEach((slice, index) => {
      const x = margin.left + index * xStep;
      const totalHeight = slice.total * scaleY;
      const topY = baseY - totalHeight;

      const outline = svgElement('rect', {
        x,
        y: topY,
        width: barWidth,
        height: totalHeight,
        class: 'column-outline',
        rx: 2,
        ry: 2
      });
      barsGroup.append(outline);

      const totalLabel = svgElement('text', {
        x: x + barWidth / 2,
        y: topY - 10,
        'text-anchor': 'middle',
        class: 'total-label'
      });
      totalLabel.textContent = formatBillions(slice.total);
      labelsGroup.append(totalLabel);

      const yearLabel = svgElement('text', {
        x: x + barWidth / 2,
        y: baseY + 30,
        'text-anchor': 'middle',
        class: 'year-label'
      });
      yearLabel.textContent = slice.label;
      labelsGroup.append(yearLabel);

      const subLabel = svgElement('text', {
        x: x + barWidth / 2,
        y: baseY + 45,
        'text-anchor': 'middle',
        class: 'total-sub'
      });
      subLabel.textContent = currentMode === 'real' ? 'real' : 'nominal';
      labelsGroup.append(subLabel);

      if (slice.estimated) {
        const estimateLabel = svgElement('text', {
          x: x + barWidth / 2,
          y: baseY + 61,
          'text-anchor': 'middle',
          class: 'estimate-label'
        });
        estimateLabel.textContent = 'est.';
        labelsGroup.append(estimateLabel);
      }

      let cursor = baseY;
      const nodeMap = new Map();

      categories.forEach((category) => {
        const value = slice.categories[category.id] || 0;
        const segmentHeight = value * scaleY;
        const y = cursor - segmentHeight;
        const previousValue =
          index > 0 ? renderedSeries[index - 1].categories[category.id] || 0 : 0;

        const node = {
          x,
          y,
          width: barWidth,
          height: segmentHeight,
          value,
          slice,
          category
        };

        nodeMap.set(category.id, node);

        if (value > 0) {
          const segment = svgElement('rect', {
            x,
            y,
            width: barWidth,
            height: segmentHeight,
            fill: category.color,
            class: previousValue === 0 && index > 0 ? 'segment emerging' : 'segment'
          });
          segment.setAttribute('tabindex', '0');

          const share = toPercent(value, slice.total);

          attachInteractions(segment, category.id, () => {
            return {
              title: `${category.icon} ${category.label}`,
              value: formatBillions(value),
              meta: `${slice.label} | ${share.toFixed(1)}% of total`,
              detail: `${currentMode === 'real' ? 'Real' : 'Nominal'} spending`
            };
          });

          barsGroup.append(segment);

          if (segmentHeight >= 19) {
            const iconLabel = svgElement('text', {
              x: x + barWidth / 2,
              y: y + segmentHeight / 2,
              class: 'cat-icon-text'
            });
            iconLabel.textContent = category.icon;
            iconLabel.dataset.category = category.id;
            interactiveElements.push(iconLabel);
            barsGroup.append(iconLabel);
          }

          if (segmentHeight >= 42) {
            const valueLabel = svgElement('text', {
              x: x + barWidth / 2,
              y: y + segmentHeight / 2 + 14,
              class: 'cat-value-text'
            });
            valueLabel.textContent = formatBillions(value);
            valueLabel.dataset.category = category.id;
            interactiveElements.push(valueLabel);
            barsGroup.append(valueLabel);
          }
        }

        cursor = y;
      });

      nodesByYear.push(nodeMap);
    });

    for (let index = 0; index < nodesByYear.length - 1; index += 1) {
      const currentNodes = nodesByYear[index];
      const nextNodes = nodesByYear[index + 1];

      categories.forEach((category) => {
        const source = currentNodes.get(category.id);
        const target = nextNodes.get(category.id);

        if (!source || !target || source.value <= 0 || target.value <= 0) {
          return;
        }

        const flow = svgElement('path', {
          d: ribbonPath(source, target),
          fill: `url(#flow-gradient-${category.id})`,
          class: 'flow'
        });

        attachInteractions(flow, category.id, () => {
          const delta = ((target.value / source.value) - 1) * 100;
          const deltaPrefix = delta >= 0 ? '+' : '';

          return {
            title: `${category.icon} ${category.label}`,
            value: `${source.slice.label} -> ${target.slice.label}`,
            meta: `${formatBillions(source.value)} to ${formatBillions(target.value)}`,
            detail: `${deltaPrefix}${delta.toFixed(1)}% change across interval`
          };
        });

        flowsGroup.append(flow);
      });
    }

    svg.append(defs, gridGroup, flowsGroup, barsGroup, labelsGroup);

    if (lockedCategory) {
      applyCategoryFocus(lockedCategory);
    } else {
      clearCategoryFocus();
    }
  }

  function syncModeButtons() {
    modeButtons.forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setMode(mode) {
    if (mode === currentMode) {
      return;
    }

    currentMode = mode;
    renderedSeries = buildSeries(currentMode);
    syncModeButtons();
    buildMetrics();
    renderChart();
    updateSummary(lockedCategory);
    hideTooltip();
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode || 'real');
    });
  });

  renderedSeries = buildSeries(currentMode);
  renderLegend();
  syncModeButtons();
  buildMetrics();
  renderChart();
  updateSummary(null);
})();
