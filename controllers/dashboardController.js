exports.renderQuestions = async (req, res) => {
    res.render('./dashboard/question/questions', { title: 'مدیریت بانک سوالات' });
};

exports.renderSubGroups = async (req, res) => {
    res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها' });
};

exports.renderResponses = async (req, res) => {
    res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ سوالات' });
};

exports.renderUsers = async (req, res) => {
    res.render('./dashboard/user/users', { title: 'مدیریت کاربران' });
};

exports.renderProfile = async (req, res) => {
    res.render('./dashboard/profile/editPersonalInformation', { title: 'مدیریت حساب' });
};