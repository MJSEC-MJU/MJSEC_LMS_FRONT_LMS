import { Link } from "react-router-dom"

export default function Profile() {
  return (
    <section className="user-profile">
      <h1 className="heading">your profile</h1>
      <div className="info">
        <div className="user">
          <img src="/images/pic-1.jpg" alt="" />
          <h3>이름</h3>
          <p>학번</p>
          <Link to="/update" className="inline-btn">update profile</Link>
        </div>

        <div className="box-container">
          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-book-open"></i>
              <div>
                <span>100%</span>
                <p>과제 제출률</p>
              </div>
            </div>
            <a href="#" className="inline-btn">제출하기</a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-laptop-code"></i>
              <div>
                <span>3개</span>
                <p>이수 과목</p>
              </div>
            </div>
            <a href="#" className="inline-btn">view more</a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-people-group"></i>
              <div>
                <span>2개</span>
                <p>활동 프로젝트</p>
              </div>
            </div>
            <a href="#" className="inline-btn">view more</a>
          </div>
        </div>
      </div>
    </section>
  )
}
