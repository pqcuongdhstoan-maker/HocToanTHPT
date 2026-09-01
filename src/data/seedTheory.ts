import { TheorySection, TheoryExample, MiniQuizItem } from '../types';

export const SEED_THEORY_SECTIONS: Record<string, TheorySection> = {
  'lesson-1': {
    id: 'th-1',
    lessonId: 'lesson-1',
    order: 1,
    title: 'Tính đơn điệu và cực trị của hàm số',
    summary: 'Sử dụng đạo hàm cấp 1 $f\'(x)$ để xét tính đồng biến, nghịch biến và tìm các điểm cực đại, cực tiểu của hàm số $y = f(x)$.',
    contentLatex: `### 1. Tính đơn điệu của hàm số
Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $(a; b)$:
- Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số **đồng biến** (tăng) trên $(a; b)$.
- Nếu $f'(x) < 0$ với mọi $x \\in (a; b)$ thì hàm số **nghịch biến** (giảm) trên $(a; b)$.
- Nếu $f'(x) = 0$ với mọi $x \\in (a; b)$ thì hàm số là hàm hằng.
- *Định lí mở rộng:* Nếu $f'(x) \\ge 0$ (hoặc $f'(x) \\le 0$) với mọi $x \\in (a; b)$ và $f'(x) = 0$ chỉ tại một số hữu hạn điểm thì hàm số đồng biến (hoặc nghịch biến) trên $(a; b)$.

### 2. Cực trị của hàm số
- Điểm $x_0$ được gọi là **điểm cực đại** nếu tồn tại khoảng $(a; b)$ chứa $x_0$ sao cho $f(x) < f(x_0)$ với mọi $x \\in (a; b) \\setminus \\{x_0\\}$.
- Điểm $x_0$ được gọi là **điểm cực tiểu** nếu tồn tại khoảng $(a; b)$ chứa $x_0$ sao cho $f(x) > f(x_0)$ với mọi $x \\in (a; b) \\setminus \\{x_0\\}$.
- **Dấu hiệu 1 (Dấu của $f'$):** Nếu khi qua $x_0$, $f'(x)$ đổi dấu từ dương sang âm thì $x_0$ là điểm cực đại; nếu đổi dấu từ âm sang dương thì $x_0$ là điểm cực tiểu.`,
    definitions: [
      'Hàm số đồng biến trên K nếu với mọi $x_1 < x_2$ thì $f(x_1) < f(x_2)$.',
      'Hàm số nghịch biến trên K nếu với mọi $x_1 < x_2$ thì $f(x_1) > f(x_2)$.',
      'Điểm cực trị là điểm mà tại đó đạo hàm $f\'(x)$ triệt tiêu hoặc không xác định và $f\'(x)$ đổi dấu khi qua điểm đó.',
    ],
    theorems: [
      'Điều kiện cần và đủ cho tính đơn điệu của hàm khả vi: $f\'(x) \\ge 0$ trên $(a; b)$ và $f\'(x)=0$ tại hữu hạn điểm $\\Leftrightarrow$ $f$ đồng biến trên $(a; b)$.',
      'Dấu hiệu 2 (Cực trị theo đạo hàm cấp 2): Giả sử $f\'(x_0) = 0$ và $f$ có đạo hàm cấp 2 tại $x_0$. Nếu $f\'\'(x_0) < 0$ thì $x_0$ là điểm cực đại; nếu $f\'\'(x_0) > 0$ thì $x_0$ là điểm cực tiểu.',
    ],
    formulas: [
      { title: 'Đạo hàm hàm đa thức bậc 3', latex: 'y = ax^3 + bx^2 + cx + d \\implies y\' = 3ax^2 + 2bx + c', note: '\\Delta\' = b^2 - 3ac' },
      { title: 'Đạo hàm phân thức bậc nhất', latex: 'y = \\frac{ax+b}{cx+d} \\implies y\' = \\frac{ad - bc}{(cx+d)^2}', note: 'Luôn cùng dấu với ad - bc' },
      { title: 'Đạo hàm phân thức bậc 2 / bậc 1', latex: 'y = \\frac{ax^2+bx+c}{px+q} \\implies y\' = \\frac{ap x^2 + 2aq x + (bq - cp)}{(px+q)^2}', note: 'Nhớ quy tắc đường chéo' },
    ],
    keyNotes: [
      'Phải luôn tìm tập xác định $D$ trước khi tính đạo hàm.',
      'Không dùng kí hiệu hợp $\\cup$ hoặc dấu cộng $+$ khi viết các khoảng đơn điệu. Phải dùng từ "và" hoặc chấm phẩy ";".',
      'Hàm số $y = \\frac{ax+b}{cx+d}$ không có cực trị vì đạo hàm không đổi dấu.',
    ],
    commonMistakes: [
      'Nhầm lẫn giữa "điểm cực trị của hàm số" ($x_0$), "cực trị của hàm số" ($y_0 = f(x_0)$), và "điểm cực trị của đồ thị hàm số" ($M(x_0; y_0)$).',
      'Kết luận hàm số đồng biến trên $\\mathbb{R} \\setminus \\{1\\}$ thay vì $(-\\infty; 1)$ và $(1; +\\infty)$.',
    ],
    tips: [
      'Ghi nhớ: "Dương đi lên, Âm đi xuống; Đổi dấu $(+ \\to -)$ là Đỉnh Núi (Cực đại), $(- \\to +)$ là Thung Lũng (Cực tiểu)".',
    ],
  },
  'lesson-11': {
    id: 'th-11',
    lessonId: 'lesson-11',
    order: 1,
    title: 'Nguyên hàm',
    summary: 'Khái niệm nguyên hàm, bảng nguyên hàm cơ bản mở rộng và 2 phương pháp tính: đổi biến số và từng phần.',
    contentLatex: `### 1. Định nghĩa và tính chất
Cho hàm số $f(x)$ xác định trên khoảng $K$. Hàm số $F(x)$ được gọi là **nguyên hàm** của $f(x)$ trên $K$ nếu:
$$F'(x) = f(x), \\quad \\forall x \\in K$$

Họ tất cả các nguyên hàm của $f(x)$ được kí hiệu là:
$$\\int f(x)\\,dx = F(x) + C \\quad (C \\in \\mathbb{R})$$

### 2. Các phương pháp tính nguyên hàm
- **Phương pháp đổi biến số:** $\\int f(u(x)) u'(x)\\,dx = \\int f(u)\\,du = F(u) + C$.
- **Phương pháp nguyên hàm từng phần:** $\\int u\\,dv = u v - \\int v\\,du$.
- *Thứ tự ưu tiên đặt $u$:* "Nhất Lô, Nhì Đa, Tam Lượng, Tứ Mũ" (Logarit $\\to$ Đa thức $\\to$ Lượng giác $\\to$ Mũ).`,
    definitions: [
      'Nguyên hàm của $f(x)$ trên $K$ là hàm $F(x)$ thỏa mãn $F\'(x) = f(x)$.',
      'Tích phân bất định $\\int f(x)dx$ biểu diễn họ tất cả các nguyên hàm sai khác nhau một hằng số cộng $C$.',
    ],
    theorems: [
      'Nếu $F(x)$ là một nguyên hàm của $f(x)$ trên $K$ thì mọi nguyên hàm của $f(x)$ trên $K$ đều có dạng $F(x) + C$.',
      'Tính chất tuyến tính: $\\int [\\alpha f(x) + \\beta g(x)]dx = \\alpha \\int f(x)dx + \\beta \\int g(x)dx$ với $\\alpha, \\beta \\in \\mathbb{R}$.',
    ],
    formulas: [
      { title: 'Nguyên hàm lũy thừa', latex: '\\int x^\\alpha\\,dx = \\frac{x^{\\alpha+1}}{\\alpha+1} + C \\quad (\\alpha \\ne -1)', note: 'Với \\alpha = -1: \\int \\frac{1}{x}dx = \\ln|x| + C' },
      { title: 'Nguyên hàm hàm mũ', latex: '\\int e^{ax+b}\\,dx = \\frac{1}{a}e^{ax+b} + C, \\quad \\int a^x\\,dx = \\frac{a^x}{\\ln a} + C', note: 'a > 0, a \\ne 1' },
      { title: 'Nguyên hàm lượng giác cơ bản', latex: '\\int \\cos(ax+b)\\,dx = \\frac{1}{a}\\sin(ax+b) + C, \\quad \\int \\sin(ax+b)\\,dx = -\\frac{1}{a}\\cos(ax+b) + C', note: 'Đổi dấu cẩn thận' },
      { title: 'Công thức từng phần', latex: '\\int u\\,dv = u\\cdot v - \\int v\\,du', note: 'dv = v\'(x)dx' },
    ],
    keyNotes: [
      'Luôn nhớ cộng hằng số $C$ trong kết quả nguyên hàm.',
      'Với $\\int \\frac{1}{x}dx$, kết quả bắt buộc phải có dấu giá trị tuyệt đối $\\ln|x| + C$.',
    ],
    commonMistakes: [
      'Quên chia cho hệ số $a$ khi tính nguyên hàm hàm hợp bậc nhất $f(ax+b)$ $\\implies \\frac{1}{a}F(ax+b) + C$.',
      'Nhầm lẫn giữa đạo hàm của $\\cos x$ ($-\\sin x$) và nguyên hàm của $\\cos x$ ($+\\sin x$).',
    ],
    tips: [
      'Kiểm tra lại kết quả nguyên hàm nhanh chóng bằng cách lấy đạo hàm của vế phải xem có bằng biểu thức dưới dấu tích phân không.',
    ],
  },
  'lesson-18': {
    id: 'th-18',
    lessonId: 'lesson-18',
    order: 1,
    title: 'Xác suất có điều kiện',
    summary: 'Xác suất của biến cố A biết biến cố B đã xảy ra, công thức tính và quy tắc nhân xác suất.',
    contentLatex: `### 1. Khái niệm xác suất có điều kiện
Cho hai biến cố $A$ và $B$ với $P(B) > 0$. Xác suất của biến cố $A$ khi biết biến cố $B$ đã xảy ra được gọi là **xác suất có điều kiện** của $A$ với điều kiện $B$, kí hiệu là $P(A|B)$:
$$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$$

### 2. Quy tắc nhân xác suất
Từ định nghĩa xác suất có điều kiện, ta có quy tắc nhân xác suất:
$$P(A \\cap B) = P(B) \\cdot P(A|B) = P(A) \\cdot P(B|A)$$

Nếu hai biến cố $A$ và $B$ độc lập thì:
$$P(A|B) = P(A) \\quad \\text{và} \\quad P(A \\cap B) = P(A) \\cdot P(B)$$`,
    definitions: [
      'Xác suất có điều kiện $P(A|B)$ đo lường khả năng xuất hiện của $A$ trong không gian biến cố thu hẹp chỉ gồm các phần tử của $B$.',
    ],
    theorems: [
      'Quy tắc nhân tổng quát cho n biến cố: $P(A_1 \\cap A_2 \\cap \\dots \\cap A_n) = P(A_1) P(A_2|A_1) P(A_3|A_1 A_2) \\dots P(A_n|A_1 \\dots A_{n-1})$.',
    ],
    formulas: [
      { title: 'Công thức xác suất có điều kiện', latex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{n(A \\cap B)}{n(B)}', note: 'P(B) > 0' },
      { title: 'Quy tắc nhân xác suất', latex: 'P(A \\cap B) = P(B) \\cdot P(A|B)', note: 'Dùng tốt khi lập sơ đồ hình cây' },
    ],
    keyNotes: [
      'Phân biệt rõ $P(A|B)$ (biết B đã xảy ra, tính A) và $P(B|A)$ (biết A đã xảy ra, tính B).',
      'Tổng xác suất có điều kiện trên biến cố đối: $P(A|B) + P(\\overline{A}|B) = 1$.',
    ],
    commonMistakes: [
      'Nhầm lẫn giữa $P(A \\cap B)$ (xác suất cả hai cùng xảy ra) và $P(A|B)$.',
      'Áp dụng công thức nhân độc lập $P(A \\cap B) = P(A)P(B)$ cho hai biến cố phụ thuộc.',
    ],
    tips: [
      'Vẽ sơ đồ hình cây để trực quan hóa các nhánh xác suất trước khi áp dụng công thức.',
    ],
  },
};

export const SEED_THEORY_EXAMPLES: Record<string, TheoryExample[]> = {
  'lesson-1': [
    {
      id: 'ex-1-1',
      lessonId: 'lesson-1',
      order: 1,
      title: 'Ví dụ 1: Tìm khoảng đơn điệu của hàm số bậc 3',
      difficulty: 'NB',
      stemLatex: 'Tìm các khoảng đồng biến và nghịch biến của hàm số $y = x^3 - 3x^2 + 2$.',
      solutionSteps: [
        {
          step: 1,
          title: 'Tập xác định và tính đạo hàm',
          latex: 'D = \\mathbb{R}. \\quad y\' = 3x^2 - 6x',
          explanation: 'Tập xác định là toàn bộ tập số thực. Lấy đạo hàm cấp 1 theo quy tắc $(x^n)\' = n x^{n-1}$.',
        },
        {
          step: 2,
          title: 'Tìm nghiệm của đạo hàm',
          latex: 'y\' = 0 \\iff 3x(x - 2) = 0 \\iff x = 0 \\quad \\text{hoặc} \\quad x = 2',
          explanation: 'Giải phương trình bậc hai đơn giản để tìm các điểm tới hạn.',
        },
        {
          step: 3,
          title: 'Xét dấu của đạo hàm $y\'$',
          latex: 'y\' > 0 \\iff x \\in (-\\infty; 0) \\cup (2; +\\infty); \\quad y\' < 0 \\iff x \\in (0; 2)',
          explanation: 'Áp dụng quy tắc dấu tam thức bậc hai: "Trong trái ngoài cùng" (hệ số $a = 3 > 0$).',
        },
        {
          step: 4,
          title: 'Kết luận',
          latex: '\\text{Đồng biến trên } (-\\infty; 0) \\text{ và } (2; +\\infty); \\quad \\text{Nghịch biến trên } (0; 2).',
          explanation: 'Hàm số đồng biến trên từng khoảng mà đạo hàm dương, nghịch biến trên khoảng mà đạo hàm âm.',
        },
      ],
      tips: 'Không được viết kết luận là "đồng biến trên $(-\\infty; 0) \\cup (2; +\\infty)$" mà phải dùng từ "và".',
    },
    {
      id: 'ex-1-2',
      lessonId: 'lesson-1',
      order: 2,
      title: 'Ví dụ 2: Tìm cực trị của hàm số trùng phương',
      difficulty: 'TH',
      stemLatex: 'Tìm điểm cực đại và điểm cực tiểu của hàm số $y = -x^4 + 2x^2 + 3$.',
      solutionSteps: [
        {
          step: 1,
          title: 'Tính đạo hàm $y\'$',
          latex: 'D = \\mathbb{R}. \\quad y\' = -4x^3 + 4x = -4x(x^2 - 1)',
          explanation: 'Đặt $-4x$ làm nhân tử chung để giải nghiệm.',
        },
        {
          step: 2,
          title: 'Tìm các điểm dừng',
          latex: 'y\' = 0 \\iff x = 0, \\; x = 1, \\; x = -1',
          explanation: 'Hàm số có 3 điểm dừng phân biệt.',
        },
        {
          step: 3,
          title: 'Lập bảng xét dấu và giá trị cực trị',
          latex: 'y(-1) = 4, \\quad y(0) = 3, \\quad y(1) = 4',
          explanation: 'Khi qua $x = -1$ và $x = 1$, $y\'$ đổi dấu từ $+$ sang $-$. Khi qua $x = 0$, $y\'$ đổi dấu từ $-$ sang $+$.',
        },
        {
          step: 4,
          title: 'Kết luận',
          latex: '\\text{Điểm cực đại: } x = -1, x = 1; \\quad \\text{Điểm cực tiểu: } x = 0.',
          explanation: 'Giá trị cực đại $y_{\\text{CĐ}} = 4$, giá trị cực tiểu $y_{\\text{CT}} = 3$.',
        },
      ],
    },
    {
      id: 'ex-1-3',
      lessonId: 'lesson-1',
      order: 3,
      title: 'Ví dụ 3: Đơn điệu của hàm phân thức hữu tỉ $y = \\frac{ax+b}{cx+d}$',
      difficulty: 'TH',
      stemLatex: 'Xét tính đơn điệu của hàm số $y = \\frac{2x - 3}{x + 1}$.',
      solutionSteps: [
        {
          step: 1,
          title: 'Tập xác định',
          latex: 'D = \\mathbb{R} \\setminus \\{-1\\}',
          explanation: 'Điều kiện mẫu số khác 0: $x + 1 \\ne 0 \\iff x \\ne -1$.',
        },
        {
          step: 2,
          title: 'Tính đạo hàm bằng công thức chéo',
          latex: 'y\' = \\frac{2\\cdot 1 - (-3)\\cdot 1}{(x+1)^2} = \\frac{5}{(x+1)^2}',
          explanation: 'Áp dụng $\\left(\\frac{ax+b}{cx+d}\\right)\' = \\frac{ad - bc}{(cx+d)^2}$.',
        },
        {
          step: 3,
          title: 'Nhận xét dấu và kết luận',
          latex: 'y\' = \\frac{5}{(x+1)^2} > 0, \\quad \\forall x \\ne -1',
          explanation: 'Hàm số đồng biến trên từng khoảng xác định $(-\\infty; -1)$ và $(-1; +\\infty)$. Hàm số không có cực trị.',
        },
      ],
    },
    {
      id: 'ex-1-4',
      lessonId: 'lesson-1',
      order: 4,
      title: 'Ví dụ 4: Tìm tham số $m$ để hàm số bậc 3 đồng biến trên $\\mathbb{R}$',
      difficulty: 'VD',
      stemLatex: 'Tìm tất cả các giá trị của tham số $m$ để hàm số $y = \\frac{1}{3}x^3 - m x^2 + (m+2)x - 1$ đồng biến trên $\\mathbb{R}$.',
      solutionSteps: [
        {
          step: 1,
          title: 'Tính đạo hàm',
          latex: 'y\' = x^2 - 2mx + (m+2)',
          explanation: 'Đạo hàm là tam thức bậc hai với hệ số $a = 1 > 0$.',
        },
        {
          step: 2,
          title: 'Điều kiện đồng biến trên $\\mathbb{R}$',
          latex: 'y\' \\ge 0, \\; \\forall x \\in \\mathbb{R} \\iff \\Delta\' \\le 0',
          explanation: 'Do hệ số $a = 1 > 0$, tam thức luôn không âm khi và chỉ khi biệt thức $\\Delta\' \\le 0$.',
        },
        {
          step: 3,
          title: 'Giải bất phương trình theo $m$',
          latex: '\\Delta\' = (-m)^2 - 1\\cdot(m+2) = m^2 - m - 2 \\le 0 \\iff -1 \\le m \\le 2',
          explanation: 'Nghiệm của $m^2 - m - 2 = 0$ là $m = -1$ và $m = 2$.',
        },
        {
          step: 4,
          title: 'Kết luận',
          latex: 'm \\in [-1; 2]',
          explanation: 'Tập hợp các giá trị cần tìm là đoạn $[-1; 2]$.',
        },
      ],
    },
    {
      id: 'ex-1-5',
      lessonId: 'lesson-1',
      order: 5,
      title: 'Ví dụ 5: Bài toán tham số cực trị có điều kiện (VDC)',
      difficulty: 'VDC',
      stemLatex: 'Tìm $m$ để đồ thị hàm số $y = x^3 - 3mx^2 + 4m^3$ có hai điểm cực trị $A, B$ sao cho tam giác $OAB$ có diện tích bằng $4$ (với $O$ là gốc tọa độ).',
      solutionSteps: [
        {
          step: 1,
          title: 'Tìm điều kiện có 2 cực trị',
          latex: 'y\' = 3x^2 - 6mx = 3x(x - 2m) = 0 \\iff x = 0 \\quad \\text{hoặc} \\quad x = 2m',
          explanation: 'Hàm số có 2 điểm cực trị phân biệt khi và chỉ khi $2m \\ne 0 \\iff m \\ne 0$.',
        },
        {
          step: 2,
          title: 'Tọa độ các điểm cực trị',
          latex: 'A(0; 4m^3), \\quad B(2m; 0)',
          explanation: 'Điểm $A$ thuộc trục $Oy$ ($x_A = 0$), điểm $B$ thuộc trục $Ox$ ($y_B = (2m)^3 - 3m(2m)^2 + 4m^3 = 0$).',
        },
        {
          step: 3,
          title: 'Tính diện tích tam giác vuông $OAB$',
          latex: 'S_{\\Delta OAB} = \\frac{1}{2} OA \\cdot OB = \\frac{1}{2} |4m^3| \\cdot |2m| = 4 m^4',
          explanation: 'Do $A \\in Oy, B \\in Ox$, tam giác $OAB$ vuông tại gốc tọa độ $O$.',
        },
        {
          step: 4,
          title: 'Giải phương trình diện tích',
          latex: '4m^4 = 4 \\iff m^4 = 1 \\iff m = \\pm 1',
          explanation: 'Cả hai giá trị $m = 1$ và $m = -1$ đều thỏa mãn điều kiện $m \\ne 0$. Kết luận: $m = \\pm 1$.',
        },
      ],
    },
  ],
};

export const SEED_MINI_QUIZZES: Record<string, MiniQuizItem[]> = {
  'lesson-1': [
    {
      id: 'mq-1-1',
      lessonId: 'lesson-1',
      question: 'Cho hàm số $y = f(x)$ có đạo hàm $f\'(x) = (x-1)^2(x+2)$. Mệnh đề nào sau đây đúng?',
      questionLatex: 'f\'(x) = (x-1)^2(x+2)',
      type: 'single_choice',
      options: [
        { id: 'A', text: 'Hàm số đạt cực đại tại $x = 1$.' },
        { id: 'B', text: 'Hàm số đạt cực tiểu tại $x = -2$.' },
        { id: 'C', text: 'Hàm số có 2 điểm cực trị.' },
        { id: 'D', text: 'Hàm số nghịch biến trên $(-\\infty; -2)$ và đồng biến trên $(-2; +\\infty)$.' },
      ],
      correctAnswer: 'B',
      explanation: 'Ta thấy $(x-1)^2 \\ge 0$ không đổi dấu khi qua $x = 1$, nên $x = 1$ không phải là điểm cực trị. Khi qua $x = -2$, $f\'(x)$ đổi dấu từ âm sang dương nên $x = -2$ là điểm cực tiểu.',
      relatedTheoryTip: 'Điểm cực trị phải là nghiệm bội lẻ của đạo hàm (nơi $f\'(x)$ thực sự đổi dấu).',
    },
    {
      id: 'mq-1-2',
      lessonId: 'lesson-1',
      question: 'Hàm số $y = \\frac{x-2}{x+1}$ nghịch biến trên khoảng nào?',
      type: 'single_choice',
      options: [
        { id: 'A', text: 'Hàm số không nghịch biến trên bất kì khoảng nào.' },
        { id: 'B', text: '$(-\\infty; -1)$' },
        { id: 'C', text: '$(-1; +\\infty)$' },
        { id: 'D', text: '$\\mathbb{R} \\setminus \\{-1\\}$' },
      ],
      correctAnswer: 'A',
      explanation: 'Đạo hàm $y\' = \\frac{1\\cdot 1 - (-2)\\cdot 1}{(x+1)^2} = \\frac{3}{(x+1)^2} > 0$ với mọi $x \\ne -1$. Do đó hàm số luôn đồng biến trên từng khoảng xác định, không có khoảng nghịch biến.',
    },
    {
      id: 'mq-1-3',
      lessonId: 'lesson-1',
      question: 'Cho hàm số $y = f(x)$ có bảng xét dấu đạo hàm như sau: $f\'(x) > 0$ trên $(-\\infty; 0)$ và $(2; +\\infty)$; $f\'(x) < 0$ trên $(0; 2)$. Số điểm cực trị của hàm số là:',
      type: 'single_choice',
      options: [
        { id: 'A', text: '0' },
        { id: 'B', text: '1' },
        { id: 'C', text: '2' },
        { id: 'D', text: '3' },
      ],
      correctAnswer: 'C',
      explanation: 'Đạo hàm đổi dấu 2 lần (tại $x = 0$ từ $+$ sang $-$, tại $x = 2$ từ $-$ sang $+$), do đó hàm số có đúng 2 điểm cực trị (1 cực đại, 1 cực tiểu).',
    },
  ],
};
